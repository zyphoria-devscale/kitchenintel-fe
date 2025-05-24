'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Sector
} from 'recharts';
import { TOKEN_KEY } from '@/lib/token';

// Type definitions based on the API contract
interface ChartData {
  category?: string;
  value?: number | object;
  label?: string;
  timestamp?: number;
  date?: string;
}

interface Graph {
  id: string;
  chart_data: ChartData[];
  updated_at: string;
  url: string;
  title: string;
  from_date: string;
  to_date: string;
  created_at: string;
}

interface DashboardInsight {
  id: string;
  type_dashboard: 'weekly' | 'monthly';
  insight: string;
  created_at: string;
  graphs: Graph[];
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DashboardInsight[];
}

// Define the tab types
type TimeRange = 'weekly' | 'monthly';

// Helper function to format currency in Indonesian Rupiah
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to format large numbers
const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Helper function to convert timestamp to readable date
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to get day name from timestamp
const getDayName = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    weekday: 'short'
  });
};

// Restaurant sales dashboard component
export const RestaurantDashboard = () => {
  const [activeTab, setActiveTab] = useState<TimeRange>('weekly');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for sidebar state changes from localStorage
  useEffect(() => {
    const checkSidebarState = () => {
      const sidebarState = localStorage.getItem('sidebarState');
      if (sidebarState) {
        setIsSidebarOpen(sidebarState === 'open');
      }
      setIsMobile(window.innerWidth < 1024);
    };

    checkSidebarState();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarState') {
        setIsSidebarOpen(e.newValue === 'open');
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    const handleSidebarChange = (e: CustomEvent) => {
      setIsSidebarOpen(e.detail.isOpen);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebarChange' as any, handleSidebarChange);

    const interval = setInterval(() => {
      const sidebarState = localStorage.getItem('sidebarState');
      if (sidebarState) {
        setIsSidebarOpen(sidebarState === 'open');
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebarChange' as any, handleSidebarChange);
      clearInterval(interval);
    };
  }, []);

  // Store data for each tab separately
  const [weeklyData, setWeeklyData] = useState<DashboardInsight[]>([]);
  const [monthlyData, setMonthlyData] = useState<DashboardInsight[]>([]);

  // Fetch dashboard data from API based on active tab
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Determine which endpoint to use based on active tab
        const endpoint = activeTab === 'weekly' 
          ? 'http://127.0.0.1:8000/api/weekly-dashboard/' 
          : 'http://127.0.0.1:8000/api/monthly-dashboard/';

        const response = await fetch(endpoint, {
          headers: {
            "Authorization": `Token ${token}`
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${activeTab} dashboard data`);
        }

        const data: ApiResponse = await response.json();
        
        // Store data in the appropriate state variable
        if (activeTab === 'weekly') {
          setWeeklyData(data.results);
        } else {
          setMonthlyData(data.results);
        }

        // Update the current dashboard data
        setDashboardData(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error(`Error fetching ${activeTab} dashboard data:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeTab]); // Re-fetch when active tab changes

  // Get current dashboard data based on active tab
  const getCurrentDashboard = () => {
    return dashboardData.find(dashboard => dashboard.type_dashboard === activeTab);
  };

  // Process chart data based on the current dashboard
  const getProcessedData = () => {
    const currentDashboard = getCurrentDashboard();

    if (!currentDashboard) {
      return {
        salesOverTime: [],
        categoryData: [],
        topMenuItems: [],
        hourlyData: []
      };
    }

    // Find specific charts by title
    const salesOverTimeChart = currentDashboard.graphs.find(g =>
      g.title.includes('Total Sales Over Time')
    );

    const categoryChart = currentDashboard.graphs.find(g =>
      g.title.includes('Total Sales by Category')
    );

    const menuChart = currentDashboard.graphs.find(g =>
      g.title.includes('Top Selling Menu Item') || g.title.includes('Top Twenty Selling Menu Item')
    );

    const hourlyChart = currentDashboard.graphs.find(g =>
      g.title.includes('Hourly Sales Heatmap')
    );

    // Process sales over time data
    const salesOverTime = salesOverTimeChart?.chart_data.map(item => ({
      time: activeTab === 'weekly' ? getDayName(item.timestamp!) : formatDate(item.timestamp!),
      sales: item.value as number,
      timestamp: item.timestamp
    })).sort((a, b) => a.timestamp! - b.timestamp!) || [];

    // Process category data
    const categoryData = categoryChart?.chart_data.map(item => ({
      name: item.category || item.label,
      value: item.value as number
    })) || [];

    // Process top menu items
    const topMenuItems = (() => {
      if (!menuChart) return [];

      const topItemsData = menuChart.chart_data.find(item => item.category === 'top_10' || item.label === 'top_10');

      if (topItemsData && typeof topItemsData.value === 'object') {
        return Object.entries(topItemsData.value as Record<string, number>)
          .slice(0, 10)
          .map(([name, quantity]) => ({
            name,
            quantity
          }));
      }

      return [];
    })();

    // Process hourly data for heatmap visualization
    const hourlyData = (() => {
      if (!hourlyChart) return [];

      // Transform hourly data for better visualization
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

      return hours.map(hour => {
        const hourData: any = { hour: `${hour}:00` };

        days.forEach(day => {
          const hourChartData = hourlyChart.chart_data.find(item => item.category === hour.toString());
          if (hourChartData && typeof hourChartData.value === 'object') {
            const dayValue = (hourChartData.value as any)[day] || 0;
            hourData[day] = dayValue;
          } else {
            hourData[day] = 0;
          }
        });

        return hourData;
      });
    })();

    return {
      salesOverTime,
      categoryData,
      topMenuItems,
      hourlyData
    };
  };

  // Custom colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF6B6B'];

  // Get processed data
  const data = getProcessedData();
  const currentDashboard = getCurrentDashboard();

  // Handle time range tab click
  const handleTabClick = (tab: TimeRange) => {
    setActiveTab(tab);
    setActiveIndex(0);
    
    // Update dashboard data from cached data when switching tabs
    if (tab === 'weekly' && weeklyData.length > 0) {
      setDashboardData(weeklyData);
    } else if (tab === 'monthly' && monthlyData.length > 0) {
      setDashboardData(monthlyData);
    }
    // If no cached data exists, the useEffect will trigger a fetch
  };

  // Handle pie chart active slice
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  // Custom pie chart active slice renderer
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#333" fontSize={16}>
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={10} textAnchor="middle" fill="#333" fontSize={16}>
          {formatCurrency(value)}
        </text>
        <text x={cx} y={cy} dy={30} textAnchor="middle" fill="#999" fontSize={14}>
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 16}
          fill={fill}
        />
      </g>
    );
  };

  // Calculate summary metrics
  const totalSales = data.salesOverTime.reduce((sum, item) => sum + item.sales, 0);
  const topSellingItem = data.topMenuItems.length > 0 ? data.topMenuItems[0] : null;
  const averageSale = data.salesOverTime.length > 0 ? totalSales / data.salesOverTime.length : 0;

  // Show loading state
  if (loading) {
    return (
      <main className={`transition-all duration-300 
        ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} 
        ${isMobile ? 'ml-0' : ''}`}
      >
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading dashboard data...</div>
          </div>
        </div>
      </main>
    );
  }

  // Show error state
  if (error) {
    return (
      <main className={`transition-all duration-300 
        ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} 
        ${isMobile ? 'ml-0' : ''}`}
      >
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-600">Error: {error}</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`transition-all duration-300 
      ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} 
      ${isMobile ? 'ml-0' : ''}`}
    >
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Restaurant Dashboard</h1>
        <p className="text-gray-600 mb-6">Performance metrics for your restaurant</p>

        {/* Time range tabs */}
        <div className="flex mb-8">
          <div className="border-b border-gray-200 w-full">
            <nav className="flex space-x-8">
              {(['weekly', 'monthly'] as TimeRange[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Sales</h3>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalSales)}
            </p>
            <p className="text-sm text-gray-500">
              {currentDashboard ?
                `${new Date(currentDashboard.graphs[0]?.from_date).toLocaleDateString('id-ID')} - ${new Date(currentDashboard.graphs[0]?.to_date).toLocaleDateString('id-ID')}`
                : 'Period'
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Top Selling Item</h3>
            <p className="text-3xl font-bold text-green-600">
              {topSellingItem ? topSellingItem.name : 'N/A'}
            </p>
            <p className="text-sm text-gray-500">
              {topSellingItem ? `${topSellingItem.quantity} units sold` : 'No data'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Average Daily Sales</h3>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(averageSale)}
            </p>
            <p className="text-sm text-gray-500">Per {activeTab === 'weekly' ? 'day' : 'month'}</p>
          </div>
        </div>

        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Line Chart - Sales Over Time */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.salesOverTime}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Sales']}
                    labelFormatter={(label) => `${activeTab === 'weekly' ? 'Day' : 'Date'}: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#0088FE"
                    activeDot={{ r: 8 }}
                    name="Sales"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart - Category Sales */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sales by Category</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.categoryData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Sales']}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    fill="#00C49F"
                    name="Sales"
                    radius={[4, 4, 0, 0]}
                  >
                    {data.categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart - Category Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Distribution by Category</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {data.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {data.categoryData.map((entry, index) => (
                <div
                  key={`legend-${index}`}
                  className="flex items-center"
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div
                    className="w-4 h-4 mr-2 rounded-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Menu Items Table */}
        {data.topMenuItems.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Menu Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Menu Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Sold
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topMenuItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights section */}
        {currentDashboard && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Insights</h3>
            <div className="prose max-w-none text-gray-700">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {currentDashboard.insight}
              </pre>
            </div>
          </div>
        )}

        {/* Last updated info */}
        <div className="mt-8 text-right text-sm text-gray-500">
          Last updated: {currentDashboard ? new Date(currentDashboard.created_at).toLocaleString('id-ID') : 'N/A'}
        </div>
      </div>
    </main>
  );
};