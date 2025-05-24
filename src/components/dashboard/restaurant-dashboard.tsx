'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Sector
} from 'recharts';
import { TOKEN_KEY } from '@/lib/token';
import { formatCurrency, formatDate, formatNumber, getDayName } from '@/lib/helper';

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

  // Generate dummy data for demonstration
  const getDummyData = () => {
    // Dummy sales over time data
    const salesOverTime = activeTab === 'weekly'
      ? [
        { time: 'Monday', sales: 2500000, timestamp: 1 },
        { time: 'Tuesday', sales: 2800000, timestamp: 2 },
        { time: 'Wednesday', sales: 3200000, timestamp: 3 },
        { time: 'Thursday', sales: 2900000, timestamp: 4 },
        { time: 'Friday', sales: 4100000, timestamp: 5 },
        { time: 'Saturday', sales: 4800000, timestamp: 6 },
        { time: 'Sunday', sales: 3600000, timestamp: 7 }
      ]
      : [
        { time: 'Jan', sales: 85000000, timestamp: 1 },
        { time: 'Feb', sales: 78000000, timestamp: 2 },
        { time: 'Mar', sales: 92000000, timestamp: 3 },
        { time: 'Apr', sales: 88000000, timestamp: 4 },
        { time: 'May', sales: 105000000, timestamp: 5 },
        { time: 'Jun', sales: 112000000, timestamp: 6 }
      ];

    // Dummy category data
    const categoryData = [
      { name: 'Chinese Food', value: 4800000 },
      { name: 'Western Food', value: 4200000 },
      { name: 'Indonesian Food', value: 3600000 },
      { name: 'Coffee', value: 1800000 },
      { name: 'Drinks', value: 900000 }
    ];

    // Dummy top menu items
    const menuItemsData = [
      { name: 'Ice Tea', quantity: 98 },
      { name: 'Matcha Latte', quantity: 85 },
      { name: 'Dimsum', quantity: 82 },
      { name: 'Cap Cay', quantity: 78 },
      { name: 'Spaghetti', quantity: 75 },
      { name: 'Burger', quantity: 68 },
      { name: 'Fried Rice', quantity: 65 },
      { name: 'Nasi Goreng', quantity: 58 },
      { name: 'Lemon Tea', quantity: 52 },
      { name: 'Sate Ayam', quantity: 45 },
      { name: 'Americano', quantity: 42 }
    ];

    const topMenuItems = menuItemsData.slice(0, 10);

    // Menu performance data (same as topMenuItems but formatted for chart)
    const menuPerformanceData = menuItemsData.slice(0, 10).map(item => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      fullName: item.name,
      quantity: item.quantity
    })).sort((a, b) => b.quantity - a.quantity);

    // Dummy hourly data for heatmap
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

    const hourlyData = hours.map(hour => {
      const hourData: any = { hour: `${hour}:00` };

      days.forEach(day => {
        // Generate realistic hourly sales patterns
        let baseValue = 100000;

        // Weekend boost
        if (day === 'Saturday' || day === 'Sunday') {
          baseValue *= 1.3;
        }

        // Peak hours (12-14, 18-20)
        if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 20)) {
          baseValue *= 1.8;
        }
        // Lunch hours (11-15)
        else if (hour >= 11 && hour <= 15) {
          baseValue *= 1.4;
        }
        // Dinner hours (17-21)
        else if (hour >= 17 && hour <= 21) {
          baseValue *= 1.6;
        }
        // Early morning and late night
        else if (hour <= 9 || hour >= 21) {
          baseValue *= 0.4;
        }

        // Add some randomness
        baseValue *= (0.8 + Math.random() * 0.4);

        hourData[day] = Math.floor(baseValue);
      });

      return hourData;
    });

    return {
      salesOverTime,
      categoryData,
      topMenuItems,
      menuPerformanceData,
      hourlyData
    };
  };

  // Process chart data based on the current dashboard
  const getProcessedData = () => {
    const currentDashboard = getCurrentDashboard();

    // For demo purposes, use dummy data. Remove this block to use API data
    if (true) { // Change to false to use real API data
      return getDummyData();
    }

    if (!currentDashboard) {
      return {
        salesOverTime: [],
        categoryData: [],
        topMenuItems: [],
        menuPerformanceData: [],
        hourlyData: []
      };
    }

    // Find specific charts by title
    const salesOverTimeChart = currentDashboard?.graphs.find(g =>
      g.title.includes('Total Sales Over Time')
    );

    const categoryChart = currentDashboard?.graphs.find(g =>
      g.title.includes('Total Sales by Category')
    );

    const menuChart = currentDashboard?.graphs.find(g =>
      g.title.includes('Top Selling Menu Item') || g.title.includes('Top Twenty Selling Menu Item')
    );

    const hourlyChart = currentDashboard?.graphs.find(g =>
      g.title.includes('Hourly Sales Heatmap')
    );

    // Process sales over time data
    const salesOverTime = salesOverTimeChart?.chart_data.map(item => ({
      time: activeTab === 'weekly' ? getDayName(item.timestamp!) : formatDate(item.timestamp!),
      sales: item.value as number,
      timestamp: item.timestamp
    })).sort((a, b) => a.timestamp! - b.timestamp!) || [];

    // Process category data for both bar chart and pie chart
    const categoryData = categoryChart?.chart_data.map(item => ({
      name: item.category || item.label,
      value: item.value as number
    })) || [];

    // Process top menu items for table
    const topMenuItems = (() => {
      if (!menuChart) return [];

      const topItemsData = menuChart?.chart_data.find(item => item.category === 'top_10' || item.label === 'top_10');

      if (topItemsData && typeof topItemsData?.value === 'object') {
        return Object.entries(topItemsData?.value as Record<string, number>)
          .slice(0, 10)
          .map(([name, quantity]) => ({
            name,
            quantity
          }));
      }

      return [];
    })();

    // Process menu performance data for horizontal bar chart (top 10)
    const menuPerformanceData = (() => {
      if (!menuChart) return [];

      const topItemsData = menuChart?.chart_data.find(item => item.category === 'top_10' || item.label === 'top_10');

      if (topItemsData && typeof topItemsData?.value === 'object') {
        return Object.entries(topItemsData?.value as Record<string, number>)
          .slice(0, 10)
          .map(([name, quantity]) => ({
            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
            fullName: name,
            quantity
          }))
          .sort((a, b) => b.quantity - a.quantity); // Sort by quantity descending
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
          const hourChartData = hourlyChart?.chart_data.find(item => item.category === hour.toString());
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
      menuPerformanceData,
      hourlyData
    };
  };

  // Custom colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF6B6B'];

  // Menu performance gradient colors (purple to green like in the image)
  const MENU_COLORS = [
    '#6B46C1', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD',
    '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'
  ];

  // Category colors (purple gradient like in the image)
  const CATEGORY_COLORS = [
    '#6B46C1', '#7C3AED', '#8B5CF6', '#A78BFA', '#F87171'
  ];

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

  // Show loading state - removed for demo, but keep the function
  if (false && loading) { // Changed to false to skip loading state for demo
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

  // Show error state - removed for demo, but keep the function
  if (false && error) { // Changed to false to skip error state for demo
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
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
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

          {/* NEW: Menu Item Performance - Vertical Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Menu Items</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.menuPerformanceData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(value) => formatNumber(value)}
                    label={{ value: 'Quantity Sold', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${formatNumber(value)} units`,
                      'Quantity Sold'
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item ? item.fullName : label;
                    }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar
                    dataKey="quantity"
                    name="Quantity Sold"
                    radius={[4, 4, 0, 0]}
                  >
                    {data.menuPerformanceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={MENU_COLORS[index % MENU_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Debug info - remove this in production */}
            <div className="mt-2 text-xs text-gray-500">
              Data items: {data.menuPerformanceData.length} |
              Sample: {data.menuPerformanceData[0]?.name} - {data.menuPerformanceData[0]?.quantity}
            </div>
          </div>

          {/* NEW: Sales by Category - Vertical Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Total Sales by Category</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.categoryData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={0}
                    textAnchor="middle"
                    height={60}
                    label={{ value: 'Category', position: 'insideBottom', offset: -3 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${formatNumber(value / 1000000)}M`}
                    label={{ value: 'Total Sales (Rp) in Millions', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Sales']}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar
                    dataKey="value"
                    name="Sales"
                    radius={[4, 4, 0, 0]}
                  >
                    {data.categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart - Category Distribution */}
          {/* <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Distribution by Category</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
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
                  className="flex items-center cursor-pointer"
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div
                    className="w-4 h-4 mr-2 rounded-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{entry.name}</span>
                </div>
              ))}
            </div>
          </div> */}
        </div>

        {/* Peak Hour Pattern - Heatmap */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Peak Hour Pattern</h3>
          <p className="text-sm text-gray-600 mb-6">Hourly Sales Heatmap by Day of Week</p>

          {/* Heatmap Container */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Hours Header */}
              <div className="flex mb-2">
                <div className="w-24 flex-shrink-0"></div>
                <div className="flex-1 grid grid-cols-15 gap-1">
                  {Array.from({ length: 15 }, (_, i) => i + 8).map(hour => (
                    <div key={hour} className="text-xs text-center text-gray-500 font-medium">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="space-y-1">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, dayIndex) => (
                  <div key={day} className="flex items-center">
                    {/* Day Label */}
                    <div className="w-24 flex-shrink-0 text-sm font-medium text-gray-700 pr-4">
                      {day}
                    </div>

                    {/* Hour Cells */}
                    <div className="flex-1 grid grid-cols-15 gap-1">
                      {Array.from({ length: 15 }, (_, hourIndex) => {
                        const hour = hourIndex + 8;

                        // Use dummy data from hourlyData or generate it
                        const hourlyValue = data.hourlyData.find(h => h.hour === `${hour}:00`)?.[day] ||
                          (() => {
                            // Fallback dummy generation if hourlyData is empty
                            let baseValue = 100000;
                            if (day === 'Saturday' || day === 'Sunday') baseValue *= 1.3;
                            if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 20)) baseValue *= 1.8;
                            else if (hour >= 11 && hour <= 15) baseValue *= 1.4;
                            else if (hour >= 17 && hour <= 21) baseValue *= 1.6;
                            else if (hour <= 9 || hour >= 21) baseValue *= 0.4;
                            return Math.floor(baseValue * (0.8 + Math.random() * 0.4));
                          })();

                        const maxValue = 500000;
                        const intensity = Math.min(hourlyValue / maxValue, 1);

                        // Color based on intensity (red to yellow gradient like in the image)
                        const getHeatmapColor = (intensity: number) => {
                          if (intensity < 0.2) return 'bg-yellow-100';
                          if (intensity < 0.4) return 'bg-yellow-200';
                          if (intensity < 0.6) return 'bg-yellow-300';
                          if (intensity < 0.8) return 'bg-orange-400';
                          return 'bg-red-500';
                        };

                        const getTextColor = (intensity: number) => {
                          return intensity > 0.6 ? 'text-white' : 'text-gray-800';
                        };

                        return (
                          <div
                            key={`${day}-${hour}`}
                            className={`
                              h-12 flex items-center justify-center text-xs font-medium border border-gray-200 rounded
                              ${getHeatmapColor(intensity)} ${getTextColor(intensity)}
                              hover:scale-105 transition-transform cursor-pointer
                            `}
                            title={`${day} ${hour}:00 - ${formatCurrency(hourlyValue)}`}
                          >
                            {formatNumber(hourlyValue / 1000)}k
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center justify-center space-x-4">
                <span className="text-sm text-gray-600">Sales Volume:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-gray-200 rounded"></div>
                  <span className="text-xs text-gray-500">Low</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-200 border border-gray-200 rounded"></div>
                  <span className="text-xs text-gray-500">Medium</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-300 border border-gray-200 rounded"></div>
                  <span className="text-xs text-gray-500">High</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-400 border border-gray-200 rounded"></div>
                  <span className="text-xs text-gray-500">Very High</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 border border-gray-200 rounded"></div>
                  <span className="text-xs text-gray-500">Peak</span>
                </div>
              </div>

              {/* Peak Info */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-gray-600">
                    <strong>Peak sales hour:</strong> 19:00
                  </span>
                  <span className="text-gray-600">
                    <strong>Peak sales day:</strong> Saturday
                  </span>
                  <span className="text-gray-600">
                    <strong>Business hours:</strong> 08:00-22:00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

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