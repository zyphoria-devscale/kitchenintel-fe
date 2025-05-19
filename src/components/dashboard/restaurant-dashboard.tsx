'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Sector
} from 'recharts';

// Define the tab types
type TimeRange = 'daily' | 'weekly' | 'monthly';


// Restaurant sales dashboard component
export const RestaurantDashboard = () => {
  const [activeTab, setActiveTab] = useState<TimeRange>('monthly');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Listen for sidebar state changes from localStorage
  useEffect(() => {
    const checkSidebarState = () => {
      // Get initial state
      const sidebarState = localStorage.getItem('sidebarState');
      if (sidebarState) {
        setIsSidebarOpen(sidebarState === 'open');
      }

      // Check if we're on mobile
      setIsMobile(window.innerWidth < 1024);
    };

    // Initial check
    checkSidebarState();

    // Set up event listener for storage changes (when sidebar toggles)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarState') {
        setIsSidebarOpen(e.newValue === 'open');
      }
    };

    // Set up window resize listener
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Set up custom event listener for sidebar changes
    const handleSidebarChange = (e: CustomEvent) => {
      setIsSidebarOpen(e.detail.isOpen);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebarChange' as any, handleSidebarChange);

    // Custom polling for sidebar state (as a fallback)
    const interval = setInterval(() => {
      const sidebarState = localStorage.getItem('sidebarState');
      if (sidebarState) {
        setIsSidebarOpen(sidebarState === 'open');
      }
    }, 500);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebarChange' as any, handleSidebarChange);
      clearInterval(interval);
    };
  }, []);

  // Generate dummy data for the charts based on selected time range
  const getData = () => {
    // Daily data - hourly breakdown
    if (activeTab === 'daily') {
      return {
        salesOverTime: Array.from({ length: 24 }, (_, i) => {
          // Create a pattern with busier lunch and dinner times
          let salesFactor = 1;
          if (i >= 11 && i <= 14) salesFactor = 3; // Lunch peak
          if (i >= 18 && i <= 21) salesFactor = 4; // Dinner peak
          if (i >= 22 || i <= 6) salesFactor = 0.5; // Late night/early morning
          
          return {
            time: `${i}:00`,
            sales: Math.floor(Math.random() * 50 * salesFactor + 20 * salesFactor),
          };
        }),
        drinkTypes: [
          { name: 'Coffee', sales: Math.floor(Math.random() * 100 + 150) },
          { name: 'Tea', sales: Math.floor(Math.random() * 80 + 100) },
          { name: 'Juice', sales: Math.floor(Math.random() * 70 + 80) },
          { name: 'Smoothie', sales: Math.floor(Math.random() * 60 + 60) },
          { name: 'Cocktail', sales: Math.floor(Math.random() * 90 + 120) },
          { name: 'Beer', sales: Math.floor(Math.random() * 110 + 140) },
          { name: 'Wine', sales: Math.floor(Math.random() * 85 + 90) },
        ],
        salesByDrink: [
          { name: 'Coffee', value: Math.floor(Math.random() * 2000 + 3000) },
          { name: 'Tea', value: Math.floor(Math.random() * 1500 + 2000) },
          { name: 'Juice', value: Math.floor(Math.random() * 1200 + 1800) },
          { name: 'Smoothie', value: Math.floor(Math.random() * 1000 + 1500) },
          { name: 'Cocktail', value: Math.floor(Math.random() * 1800 + 2200) },
          { name: 'Beer', value: Math.floor(Math.random() * 2000 + 2500) },
          { name: 'Wine', value: Math.floor(Math.random() * 1700 + 2000) },
        ],
      };
    }
    
    // Weekly data - days of week
    else if (activeTab === 'weekly') {
      return {
        salesOverTime: [
          { time: 'Monday', sales: Math.floor(Math.random() * 500 + 1200) },
          { time: 'Tuesday', sales: Math.floor(Math.random() * 400 + 1000) },
          { time: 'Wednesday', sales: Math.floor(Math.random() * 450 + 1100) },
          { time: 'Thursday', sales: Math.floor(Math.random() * 500 + 1300) },
          { time: 'Friday', sales: Math.floor(Math.random() * 700 + 1800) },
          { time: 'Saturday', sales: Math.floor(Math.random() * 900 + 2200) },
          { time: 'Sunday', sales: Math.floor(Math.random() * 800 + 1900) },
        ],
        drinkTypes: [
          { name: 'Coffee', sales: Math.floor(Math.random() * 400 + 900) },
          { name: 'Tea', sales: Math.floor(Math.random() * 300 + 700) },
          { name: 'Juice', sales: Math.floor(Math.random() * 250 + 600) },
          { name: 'Smoothie', sales: Math.floor(Math.random() * 200 + 500) },
          { name: 'Cocktail', sales: Math.floor(Math.random() * 350 + 800) },
          { name: 'Beer', sales: Math.floor(Math.random() * 500 + 1000) },
          { name: 'Wine', sales: Math.floor(Math.random() * 400 + 900) },
        ],
        salesByDrink: [
          { name: 'Coffee', value: Math.floor(Math.random() * 10000 + 15000) },
          { name: 'Tea', value: Math.floor(Math.random() * 7000 + 12000) },
          { name: 'Juice', value: Math.floor(Math.random() * 6000 + 9000) },
          { name: 'Smoothie', value: Math.floor(Math.random() * 5000 + 8000) },
          { name: 'Cocktail', value: Math.floor(Math.random() * 9000 + 13000) },
          { name: 'Beer', value: Math.floor(Math.random() * 12000 + 18000) },
          { name: 'Wine', value: Math.floor(Math.random() * 8000 + 14000) },
        ],
      };
    }
    
    // Monthly data - months of the year 2025
    else {
      return {
        salesOverTime: [
          { time: 'Jan', sales: Math.floor(Math.random() * 2000 + 5000) },
          { time: 'Feb', sales: Math.floor(Math.random() * 1800 + 4800) },
          { time: 'Mar', sales: Math.floor(Math.random() * 2200 + 5500) },
          { time: 'Apr', sales: Math.floor(Math.random() * 2500 + 6000) },
          { time: 'May', sales: Math.floor(Math.random() * 2300 + 5800) },
          { time: 'Jun', sales: Math.floor(Math.random() * 2800 + 6500) },
          { time: 'Jul', sales: Math.floor(Math.random() * 3200 + 7000) },
          { time: 'Aug', sales: Math.floor(Math.random() * 3500 + 7500) },
          { time: 'Sep', sales: Math.floor(Math.random() * 3000 + 6800) },
          { time: 'Oct', sales: Math.floor(Math.random() * 2800 + 6200) },
          { time: 'Nov', sales: Math.floor(Math.random() * 3200 + 7000) },
          { time: 'Dec', sales: Math.floor(Math.random() * 4000 + 8000) },
        ],
        drinkTypes: [
          { name: 'Beer', sales: Math.floor(Math.random() * 2000 + 5000) },
          { name: 'Wine', sales: Math.floor(Math.random() * 1500 + 4000) },
          { name: 'Coffee', sales: Math.floor(Math.random() * 1200 + 3500) },
          { name: 'Cocktail', sales: Math.floor(Math.random() * 1000 + 3000) },
          { name: 'Tea', sales: Math.floor(Math.random() * 800 + 2500) },
          { name: 'Smoothie', sales: Math.floor(Math.random() * 700 + 2000) },
          { name: 'Juice', sales: Math.floor(Math.random() * 600 + 1500) },
        ],
        salesByDrink: [
          { name: 'Beer', value: Math.floor(Math.random() * 60000 + 140000) },
          { name: 'Wine', value: Math.floor(Math.random() * 45000 + 110000) },
          { name: 'Coffee', value: Math.floor(Math.random() * 40000 + 100000) },
          { name: 'Cocktail', value: Math.floor(Math.random() * 35000 + 90000) },
          { name: 'Tea', value: Math.floor(Math.random() * 25000 + 70000) },
          { name: 'Smoothie', value: Math.floor(Math.random() * 20000 + 60000) },
          { name: 'Juice', value: Math.floor(Math.random() * 15000 + 50000) },
        ],
      };
    }
  };

  // Custom colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF6B6B'];

  // Get data based on active tab
  const data = getData();

  // Handle time range tab click
  const handleTabClick = (tab: TimeRange) => {
    setActiveTab(tab);
    setActiveIndex(0); // Reset active pie slice on tab change
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
          ${value.toLocaleString()}
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

  // Mapping time range to readable text
  const timeRangeText = {
    daily: 'Today',
    weekly: 'This Week',
    monthly: '2025 Monthly'
  };
  
  // Format currency for tooltips
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <main className={`transition-all duration-300 
      ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} 
      ${isMobile ? 'ml-0' : ''}`}
    >
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Restaurant Dashboard</h1>
        <p className="text-gray-600 mb-6">Performance metrics for your restaurant in 2025</p>
        
        {/* Time range tabs */}
        <div className="flex mb-8">
          <div className="border-b border-gray-200 w-full">
            <nav className="flex space-x-8">
              {(['weekly', 'monthly'] as TimeRange[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab
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
              ${data.salesOverTime.reduce((sum, item) => sum + item.sales, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">{timeRangeText[activeTab]}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Top Selling Drink</h3>
            <p className="text-3xl font-bold text-green-600">
              {data.drinkTypes.sort((a, b) => b.sales - a.sales)[0].name}
            </p>
            <p className="text-sm text-gray-500">{data.drinkTypes.sort((a, b) => b.sales - a.sales)[0].sales} units</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Average Sale</h3>
            <p className="text-3xl font-bold text-purple-600">
              ${Math.floor(data.salesOverTime.reduce((sum, item) => sum + item.sales, 0) / data.salesOverTime.length).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Per {activeTab === 'daily' ? 'hour' : activeTab === 'weekly' ? 'day' : 'month'}</p>
          </div>
        </div>
        
        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Line Chart */}
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
                    interval={activeTab === 'daily' ? 1 : 0}
                    angle={activeTab === 'daily' ? -45 : 0}
                    height={60}
                    textAnchor={activeTab === 'daily' ? 'end' : 'middle'}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value}`, 'Sales']}
                    labelFormatter={(label) => `${activeTab === 'daily' ? 'Hour' : activeTab === 'weekly' ? 'Day' : 'Month'}: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#0088FE" 
                    activeDot={{ r: 8 }} 
                    name="Sales ($)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Drinks Sales Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.drinkTypes}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value}`, 'Sales']}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="sales" 
                    fill="#00C49F" 
                    name="Sales ($)"
                    radius={[4, 4, 0, 0]}
                  >
                    {data.drinkTypes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Distribution by Drink Type</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={data.salesByDrink}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {data.salesByDrink.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatCurrency} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {data.salesByDrink.map((entry, index) => (
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
        
        {/* Last updated info */}
        <div className="mt-8 text-right text-sm text-gray-500">
          Last updated: May 10, 2025 | Data is simulated for demonstration
        </div>
      </div>
    </main>
  );
}