'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, Receipt, ShoppingBag, ArrowRight, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

// shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from 'react-hot-toast';
import CreateOrderModal from './create-order-modal';
import { TOKEN_KEY } from '@/lib/token';
import { API_BASE_URL } from '@/lib/api_base_url';

// Types based on API contract
enum OrderStatus {
    PAID = 'PAID',
    UNPAID = 'UNPAID'
}

type Menu = {
    id: string;
    title: string;
    price: number;
    description?: string;
    categoryId: string;
    is_recommend?: boolean;
};

type MenuCategory = {
    id: string;
    title: string;
    description?: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
};

type OrderItem = {
    id: string;
    quantity: number;
    price_at_order_time: number;
    subtotal: number;
    notes?: string;
    order_id: string;
    menu_id: string;
    created_at: string;
    updated_at: string;
    menu?: Menu;
};

type Order = {
    id: string;
    customer_name: string;
    status: OrderStatus;
    total_amount: number;
    order_items: OrderItem[];
    created_at: string;
    updated_at: string;
};

// Form schemas
const orderItemSchema = z.object({
    menu_id: z.string().min(1, { message: "Menu item is required" }),
    quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
    notes: z.string().optional(),
});

const orderFormSchema = z.object({
    customer_name: z.string().min(2, { message: "Customer name must be at least 2 characters" }),
    status: z.nativeEnum(OrderStatus),
    items: z.array(orderItemSchema).min(1, { message: "At least one item is required" }),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export const OrderManagement = () => {
    // Add mounted state to prevent hydration errors
    const [mounted, setMounted] = useState(false);

    const [orders, setOrders] = useState<Order[]>([]);
    const [menus, setMenus] = useState<Menu[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
    const [dateFilter, setDateFilter] = useState<string>('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // Only initialize with default values after mounting
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
    const [unpaidLoading, setUnpaidLoading] = useState(false);
    const [unpaidCurrentPage, setUnpaidCurrentPage] = useState(1);
    const [unpaidTotalPages, setUnpaidTotalPages] = useState(1);
    const [unpaidTotalItems, setUnpaidTotalItems] = useState(0);
    const [activeTab, setActiveTab] = useState('all');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Mark component as mounted after initial render
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch all orders with pagination
    const fetchOrders = async (page = 1) => {
        if (!mounted) return; // Skip API calls if not mounted

        setIsLoading(true);
        try {
            // Build the URL with query parameters
            const params = new URLSearchParams();

            // Always include page and pageSize parameters
            params.append('page', page.toString());
            // params.append('page_size', pageSize.toString());

            if (statusFilter !== 'ALL') {
                params.append('status', statusFilter);
            }
            if (dateFilter) {
                params.append('created_at', dateFilter);
            }
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            // Create the URL with all parameters
            const token = localStorage.getItem(TOKEN_KEY);
            const url = `${API_BASE_URL}/orders-with-items/?${params.toString()}`;

            console.log(`Fetching orders from: ${url}`); // Debugging

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    // Include authentication if your API requires it
                    // 'Authorization': 'Bearer your-token-here'
                    "Authorization": `Token ${token}`
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch orders: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data); // Debugging

            // Check if the response is an array or a paginated response object
            if (Array.isArray(data)) {
                // Direct array of orders (no pagination)
                setOrders(data);
                setTotalItems(data.length);
                setTotalPages(1);
                setCurrentPage(1);
            } else if (data.results && Array.isArray(data.results)) {
                // Paginated response
                setOrders(data.results);
                setTotalItems(data.count);
                const totalPgs = Math.ceil(data.count / pageSize);
                setTotalPages(totalPgs);
                setCurrentPage(page);
            } else {
                // Unexpected response format
                console.error('Unexpected API response format:', data);
                setOrders([]);
                setTotalItems(0);
                setTotalPages(1);
            }

        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
            setOrders([]);
            setTotalItems(0);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (!mounted) return;
        if (newPage < 1 || newPage > totalPages) return;
        fetchOrders(newPage);
    };

    const fetchCategories = async () => {
        if (!mounted) return;

        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_BASE_URL}/menu-categories/`, {
                headers: {
                    'Content-Type': 'application/json',
                    // Include authentication if your API requires it
                    // 'Authorization': 'Bearer your-token-here'
                    "Authorization": `Token ${token}`
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch categories: ${response.status}`);
            }

            const data = await response.json();
            console.log('Categories data:', data);
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load menu categories');
        }
    };

    const fetchMenus = async (categoryId?: string) => {
        if (!mounted) return;

        try {
            let allMenuItems: any[] = [];
            let currentPage = 1;
            let hasNextPage = true;

            while (hasNextPage) {
                let url = `${API_BASE_URL}/menus/?page=${currentPage}`;
                if (categoryId) {
                    url += `&category_id=${categoryId}`;
                }

                const token = localStorage.getItem(TOKEN_KEY)
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        // Include authentication if your API requires it
                        // 'Authorization': 'Bearer your-token-here'
                        "Authorization": `Token ${token}`
                    },
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch menus: ${response.status}`);
                }

                const data = await response.json();
                console.log(`Menus data page ${currentPage}:`, data);

                // Handle paginated response
                if (data.results && Array.isArray(data.results)) {
                    allMenuItems = [...allMenuItems, ...data.results];
                    hasNextPage = !!data.next; // Check if there's a next page
                    currentPage++;
                } else if (Array.isArray(data)) {
                    // Handle non-paginated response (fallback)
                    allMenuItems = data;
                    hasNextPage = false;
                } else {
                    console.error('Expected array or paginated response but received:', typeof data, data);
                    setMenus([]);
                    toast.error('Invalid menu data format received');
                    return;
                }
            }

            console.log(`Total menus fetched: ${allMenuItems.length}`);

            // Fix the mapping to match API response structure
            setMenus(allMenuItems.map((menu: any) => ({
                id: menu.id,
                title: menu.title,
                price: parseFloat(menu.price), // API returns string, convert to number
                description: menu.description,
                categoryId: menu.category_id,
                is_recommend: menu.is_recommend // Add missing field
            })));

        } catch (error) {
            console.error('Error fetching menus:', error);
            toast.error('Failed to load menu items');
            setMenus([]); // Set empty array on error
        }
    };

    const fetchUnpaidOrders = async (page = 1) => {
        if (!mounted) return;

        setUnpaidLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('status', 'UNPAID'); // Always filter for unpaid only

            const url = `${API_BASE_URL}/orders-with-items/?${params.toString()}`;
            console.log(`Fetching unpaid orders from: ${url}`);

             const token = localStorage.getItem(TOKEN_KEY)
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    // Include authentication if your API requires it
                    // 'Authorization': 'Bearer your-token-here'
                    "Authorization": `Token ${token}`
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch unpaid orders: ${response.status}`);
            }

            const data = await response.json();
            console.log('Unpaid API Response:', data);

            if (Array.isArray(data)) {
                setUnpaidOrders(data);
                setUnpaidTotalItems(data.length);
                setUnpaidTotalPages(1);
                setUnpaidCurrentPage(1);
            } else if (data.results && Array.isArray(data.results)) {
                setUnpaidOrders(data.results);
                setUnpaidTotalItems(data.count);
                const totalPgs = Math.ceil(data.count / pageSize);
                setUnpaidTotalPages(totalPgs);
                setUnpaidCurrentPage(page);
            } else {
                setUnpaidOrders([]);
                setUnpaidTotalItems(0);
                setUnpaidTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching unpaid orders:', error);
            toast.error('Failed to load unpaid orders');
            setUnpaidOrders([]);
            setUnpaidTotalItems(0);
            setUnpaidTotalPages(1);
        } finally {
            setUnpaidLoading(false);
        }
    };

    // Handle unpaid page change
    const handleUnpaidPageChange = (newPage: number) => {
        if (!mounted) return;
        if (newPage < 1 || newPage > unpaidTotalPages) return;
        fetchUnpaidOrders(newPage);
    };


    // Initial data loading - only after component has mounted
    useEffect(() => {
        if (mounted) {
            fetchOrders(1);
            fetchMenus();
            fetchCategories()
        }
    }, [mounted, pageSize]);

    // Update when filters change - only after mounting
    useEffect(() => {
        if (!mounted) return;
        fetchOrders(1); // Reset to first page when filters change
    }, [statusFilter, dateFilter, mounted]);

    // Handle search with debounce - only after mounting
    useEffect(() => {
        if (!mounted) return;

        const delayDebounceFn = setTimeout(() => {
            fetchOrders(1); // Reset to first page when search changes
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, mounted]);

    // Handle sidebar state - only after mounting
    useEffect(() => {
        if (!mounted) return;

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
    }, [mounted]);

    const sortedOrders = Array.isArray(orders) ?
        [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [];

    // Get menu title by ID
    const getMenuTitle = (menuId: string): string => {
        const menu = menus.find(menu => menu.id === menuId);
        return menu ? menu.title : 'Unknown';
    };

    // Get menu price by ID
    const getMenuPrice = (menuId: string): number => {
        const menu = menus.find(menu => menu.id === menuId);
        return menu ? menu.price : 0;
    };

    const handleUpdateOrder = async (data: OrderFormValues) => {
        if (!mounted || !currentOrder) return;

        try {
            toast.loading('Updating order...');

            const token = localStorage.getItem(TOKEN_KEY)
            const response = await fetch(`${API_BASE_URL}/orders-with-items/${currentOrder.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify({
                    customer_name: data.customer_name,
                    status: data.status,
                    items: data.items.map(item => ({
                        quantity: item.quantity,
                        notes: item.notes || '',
                        menu_id: item.menu_id
                    }))
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = JSON.stringify(errorData);
                throw new Error(`Failed to update order: ${errorMessage}`);
            }

            // Refresh orders
            fetchOrders(currentPage);

            setIsEditDialogOpen(false);
            setCurrentOrder(null);
            toast.dismiss();
            toast.success('Order updated successfully');
        } catch (error) {
            console.error('Error updating order:', error);
            toast.dismiss();
            toast.error(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Delete order
    const handleDeleteOrder = async (orderId: string) => {
        if (!mounted) return;

        try {
            toast.loading('Deleting order...');

            const token = localStorage.getItem(TOKEN_KEY)
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/`, {
                method: 'DELETE',
                 headers: {
                    'Content-Type': 'application/json',
                    // Include authentication if your API requires it
                    // 'Authorization': 'Bearer your-token-here'
                    "Authorization": `Token ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to delete order: ${response.status}`);
            }

            // Refresh orders - if we deleted the last item on a page, go back one page
            const updatedPage = orders.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
            fetchOrders(updatedPage);

            toast.dismiss();
            toast.success('Order deleted successfully');
        } catch (error) {
            console.error('Error deleting order:', error);
            toast.dismiss();
            toast.error(`Failed to delete order: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };



    // Update order status
    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        if (!mounted) return;

        try {
            toast.loading('Updating order status...');

            // Find order from current tab data
            const order = activeTab === 'unpaid'
                ? unpaidOrders.find(o => o.id === orderId)
                : orders.find(o => o.id === orderId);

            if (!order) {
                throw new Error('Order not found');
            }

            const token = localStorage.getItem(TOKEN_KEY)
            const response = await fetch(`${API_BASE_URL}/orders-with-items/${orderId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify({
                    customer_name: order.customer_name,
                    status: newStatus,
                    items: order.order_items.map((item: { quantity: number; notes?: string; menu_id: string; }) => ({
                        quantity: item.quantity,
                        notes: item.notes || '',
                        menu_id: item.menu_id
                    }))
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update order status: ${response.status}`);
            }

            // Refresh both tabs data
            fetchOrders(currentPage);
            fetchUnpaidOrders(unpaidCurrentPage);

            toast.dismiss();
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.dismiss();
            toast.error(`Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };


    const handleOrderSuccess = () => {
        fetchOrders(currentPage); // Refresh all orders
        if (activeTab === 'unpaid') {
            fetchUnpaidOrders(unpaidCurrentPage); // Also refresh unpaid if on that tab
        }
    };

    // Format price utility
    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    // Pagination component
    const Pagination = () => {
        // Calculate what page numbers to show
        let pageNumbers = [];

        if (totalPages <= 5) {
            // Show all pages if there are 5 or fewer
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            // Always include first and last page
            // Also include current page and one on either side
            pageNumbers.push(1);

            if (currentPage > 3) {
                pageNumbers.push('...');
            }

            // Pages around current page
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pageNumbers.push(i);
            }

            if (currentPage < totalPages - 2) {
                pageNumbers.push('...');
            }

            pageNumbers.push(totalPages);
        }

        return (
            <div className="flex flex-col items-center justify-center px-2 py-4 space-y-2">
                <div className='flex items-center space-x-2'>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {pageNumbers.map((page, index) => (
                            typeof page === 'number' ? (
                                <Button
                                    key={index}
                                    variant={page === currentPage ? "default" : "outline"}
                                    size="sm"
                                    className="px-3"
                                    onClick={() => handlePageChange(page)}
                                    disabled={isLoading}
                                >
                                    {page}
                                </Button>
                            ) : (
                                <span key={index} className="px-1">...</span>
                            )
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || isLoading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex text-sm text-gray-500 mt-4">
                    {totalItems > 0 ? (
                        <>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} orders</>
                    ) : (
                        <>No orders found</>
                    )}
                </div>
            </div>
        );
    };

    const UnpaidPagination = () => {
        let pageNumbers = [];

        if (unpaidTotalPages <= 5) {
            for (let i = 1; i <= unpaidTotalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            if (unpaidCurrentPage > 3) {
                pageNumbers.push('...');
            }
            for (let i = Math.max(2, unpaidCurrentPage - 1); i <= Math.min(unpaidTotalPages - 1, unpaidCurrentPage + 1); i++) {
                pageNumbers.push(i);
            }
            if (unpaidCurrentPage < unpaidTotalPages - 2) {
                pageNumbers.push('...');
            }
            pageNumbers.push(unpaidTotalPages);
        }

        return (
            <div className="flex flex-col items-center justify-center px-2 py-4 space-y-2">
                <div className='flex items-center space-x-2'>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnpaidPageChange(unpaidCurrentPage - 1)}
                            disabled={unpaidCurrentPage === 1 || unpaidLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {pageNumbers.map((page, index) => (
                            typeof page === 'number' ? (
                                <Button
                                    key={index}
                                    variant={page === unpaidCurrentPage ? "default" : "outline"}
                                    size="sm"
                                    className="px-3"
                                    onClick={() => handleUnpaidPageChange(page)}
                                    disabled={unpaidLoading}
                                >
                                    {page}
                                </Button>
                            ) : (
                                <span key={index} className="px-1">...</span>
                            )
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnpaidPageChange(unpaidCurrentPage + 1)}
                            disabled={unpaidCurrentPage === unpaidTotalPages || unpaidLoading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex text-sm text-gray-500 mt-4">
                    {unpaidTotalItems > 0 ? (
                        <>Showing {((unpaidCurrentPage - 1) * pageSize) + 1} to {Math.min(unpaidCurrentPage * pageSize, unpaidTotalItems)} of {unpaidTotalItems} unpaid orders</>
                    ) : (
                        <>No unpaid orders found</>
                    )}
                </div>
            </div>
        );
    };

    // Order Form Component (for edit only, create uses the modal)
    const OrderForm = ({
        order,
        onSubmit
    }: {
        order?: Order,
        onSubmit: (data: OrderFormValues) => void
    }) => {
        const { register, control, handleSubmit, formState, watch, setValue } = useForm<OrderFormValues>({
            resolver: zodResolver(orderFormSchema),
            defaultValues: order ? {
                customer_name: order.customer_name,
                status: order.status,
                items: order.order_items.map(item => ({
                    menu_id: item.menu_id,
                    quantity: item.quantity,
                    notes: item.notes || ''
                }))
            } : {
                customer_name: '',
                status: OrderStatus.UNPAID,
                items: [{ menu_id: '', quantity: 1, notes: '' }]
            }
        });

        const { fields, append, remove } = useFieldArray({
            control,
            name: "items",
        });

        // Calculate subtotal for each item
        const calculateItemSubtotal = (menuId: string, quantity: number) => {
            const price = getMenuPrice(menuId);
            return price * quantity;
        };

        // Calculate total amount
        const orderItems = watch('items');
        const totalAmount = orderItems.reduce((total, item) => {
            if (!item.menu_id) return total;
            return total + calculateItemSubtotal(item.menu_id, item.quantity || 0);
        }, 0);

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="customer_name">Customer Name</Label>
                        <Input
                            id="customer_name"
                            placeholder="Customer name"
                            {...register("customer_name")}
                        />
                        {formState.errors.customer_name && (
                            <p className="text-sm text-red-500">{formState.errors.customer_name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Order Status</Label>
                        <Select
                            defaultValue={watch("status")}
                            onValueChange={(value) => setValue("status", value as OrderStatus)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={OrderStatus.PAID}>Paid</SelectItem>
                                <SelectItem value={OrderStatus.UNPAID}>Unpaid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Order Items</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ menu_id: '', quantity: 1, notes: '' })}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Item
                        </Button>
                    </div>

                    {formState.errors.items?.message && (
                        <p className="text-sm text-red-500">{formState.errors.items.message}</p>
                    )}

                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium">Item #{index + 1}</h4>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="space-y-2 md:col-span-6">
                                            <Label htmlFor={`items.${index}.menu_id`}>Menu Item</Label>
                                            <Select
                                                defaultValue={watch(`items.${index}.menu_id`) || undefined}
                                                onValueChange={(value) => setValue(`items.${index}.menu_id`, value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select menu item" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {menus.map((menuItem) => (
                                                        <SelectItem key={menuItem.id} value={menuItem.id}>
                                                            {menuItem.title} - {formatPrice(menuItem.price)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {formState.errors.items?.[index]?.menu_id && (
                                                <p className="text-sm text-red-500">
                                                    {formState.errors.items[index]?.menu_id?.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor={`items.${index}.quantity`}>Qty</Label>
                                            <Input
                                                id={`items.${index}.quantity`}
                                                type="number"
                                                min="1"
                                                {...register(`items.${index}.quantity`, {
                                                    valueAsNumber: true,
                                                    min: 1
                                                })}
                                            />
                                            {formState.errors.items?.[index]?.quantity && (
                                                <p className="text-sm text-red-500">
                                                    {formState.errors.items[index]?.quantity?.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 md:col-span-4">
                                            <Label htmlFor={`items.${index}.notes`}>Notes (Optional)</Label>
                                            <Input
                                                id={`items.${index}.notes`}
                                                placeholder="e.g., No onions"
                                                {...register(`items.${index}.notes`)}
                                            />
                                        </div>
                                    </div>

                                    {watch(`items.${index}.menu_id`) && (
                                        <div className="mt-2 text-right">
                                            <span className="text-sm text-gray-500">
                                                Subtotal: {formatPrice(calculateItemSubtotal(
                                                    watch(`items.${index}.menu_id`),
                                                    watch(`items.${index}.quantity`) || 0
                                                ))}
                                            </span>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                    <div className="text-lg font-semibold">Total Amount:</div>
                    <div className="text-lg font-bold">{formatPrice(totalAmount)}</div>
                </div>

                <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                        {order ? 'Update Order' : 'Create Order'}
                    </Button>
                </DialogFooter>
            </form>
        );
    };

    // View Order Component
    const ViewOrder = ({ order }: { order: Order }) => {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                        <p className="text-sm text-gray-500">
                            Created: {format(new Date(order.created_at), 'PPP p')}
                        </p>
                    </div>
                    <Badge variant="secondary" className={`${order.status === OrderStatus.PAID ? "bg-green-500 hover:bg-green-500 text-white" : ""}`}>
                        {order.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-medium mb-1">Customer</h4>
                        <p>{order.customer_name}</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium mb-2">Order Items</h4>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.order_items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div>
                                            <div>{getMenuTitle(item.menu_id)}</div>
                                            {item.notes && (
                                                <div className="text-xs text-gray-500">Note: {item.notes}</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{formatPrice(item.price_at_order_time)}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatPrice(item.subtotal)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                    <div className="text-lg font-semibold">Total Amount:</div>
                    <div className="text-lg font-bold">{formatPrice(parseFloat(order.total_amount.toString()))}</div>
                </div>

                <DialogFooter>
                    {order.status === OrderStatus.UNPAID && (
                        <Button
                            variant="outline"
                            className="mr-2"
                            onClick={() => {
                                handleStatusChange(order.id, OrderStatus.PAID);
                                setIsViewDialogOpen(false);
                            }}
                        >
                            Mark as Paid
                        </Button>
                    )}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="default"
                                onClick={() => {
                                    setCurrentOrder(order);
                                    setIsViewDialogOpen(false);
                                }}
                            >
                                Edit Order
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>Edit Order #{order.id}</DialogTitle>
                                <DialogDescription>
                                    Make changes to the order details and items.
                                </DialogDescription>
                            </DialogHeader>
                            {currentOrder && (
                                <OrderForm order={currentOrder} onSubmit={handleUpdateOrder} />
                            )}
                        </DialogContent>
                    </Dialog>
                </DialogFooter>
            </div>
        );
    };

    // Use a client-only rendering approach for the main component
    if (!mounted) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-500">Loading order management...</p>
            </div>
        );
    }

    return (
        <div className={`transition-all duration-300 
            ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} 
            ${isMobile ? 'ml-0' : ''}`}
        >
            <div className="flex flex-col space-y-6 p-6 mx-auto max-w-7xl">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Order Management</h1>

                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Order
                    </Button>
                </div>

                {/* Create Order Modal */}
                <CreateOrderModal
                    isOpen={isCreateDialogOpen}
                    onClose={() => setIsCreateDialogOpen(false)}
                    onSuccess={handleOrderSuccess}
                />

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            type="search"
                            placeholder="Search by customer name or order ID..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-9 w-9"
                                onClick={() => setSearchTerm('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                        <SelectTrigger className="w-full md:w-40">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Orders</SelectItem>
                            <SelectItem value={OrderStatus.PAID}>Paid</SelectItem>
                            <SelectItem value={OrderStatus.UNPAID}>Unpaid</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full md:w-40"
                    />
                </div>

                <Tabs defaultValue="all" className="w-full" onValueChange={(value) => {
                    setActiveTab(value);
                    if (value === 'unpaid' && unpaidOrders.length === 0) {
                        fetchUnpaidOrders(1); // Fetch unpaid orders when tab is first opened
                    }
                }}>
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="all">
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            All Orders
                        </TabsTrigger>
                        <TabsTrigger value="unpaid">
                            <Receipt className="h-4 w-4 mr-2" />
                            Unpaid Orders
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-4">
                        <div className="rounded-md border">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <p>Loading orders...</p>
                                </div>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedOrders && sortedOrders.length > 0 ? (
                                                sortedOrders.map((order) => (
                                                    <TableRow key={order.id}>
                                                        <TableCell className="font-medium">#{order.id}</TableCell>
                                                        <TableCell>{order.customer_name}</TableCell>
                                                        <TableCell>{order.order_items.length} items</TableCell>
                                                        <TableCell>{formatPrice(parseFloat(order.total_amount.toString()))}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={order.status === OrderStatus.PAID ? "default" : "secondary"}
                                                                className={`capitalize ${order.status === OrderStatus.PAID ? "bg-green-500 hover:bg-green-500" : ""}`}
                                                            >
                                                                {order.status.toLowerCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{format(new Date(order.created_at), 'PP')}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Dialog open={isViewDialogOpen && currentOrder?.id === order.id} onOpenChange={(open) => {
                                                                    setIsViewDialogOpen(open);
                                                                    if (!open) setCurrentOrder(null);
                                                                }}>
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => {
                                                                                setCurrentOrder(order);
                                                                                setIsViewDialogOpen(true);
                                                                            }}
                                                                        >
                                                                            <Search className="h-4 w-4" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="sm:max-w-[700px]">
                                                                        <DialogHeader>
                                                                            <DialogTitle>Order Details</DialogTitle>
                                                                        </DialogHeader>
                                                                        {currentOrder && currentOrder.id === order.id && (
                                                                            <ViewOrder order={currentOrder} />
                                                                        )}
                                                                    </DialogContent>
                                                                </Dialog>

                                                                <Dialog open={isEditDialogOpen && currentOrder?.id === order.id} onOpenChange={(open) => {
                                                                    setIsEditDialogOpen(open);
                                                                    if (!open) setCurrentOrder(null);
                                                                }}>
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => {
                                                                                setCurrentOrder(order);
                                                                                setIsEditDialogOpen(true);
                                                                            }}
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="sm:max-w-[800px]">
                                                                        <DialogHeader>
                                                                            <DialogTitle>Edit Order #{order.id}</DialogTitle>
                                                                            <DialogDescription>
                                                                                Make changes to the order details and items.
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        {currentOrder && currentOrder.id === order.id && (
                                                                            <OrderForm order={currentOrder} onSubmit={handleUpdateOrder} />
                                                                        )}
                                                                    </DialogContent>
                                                                </Dialog>

                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to delete order #{order.id} for {order.customer_name}? This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeleteOrder(order.id)}
                                                                                className="bg-red-500 hover:bg-red-600"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-24 text-center">
                                                        {isLoading ? 'Loading orders...' : 'No orders found.'}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    <Pagination />
                                </>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="unpaid" className="mt-4">
                        {unpaidLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <p>Loading unpaid orders...</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {unpaidOrders && unpaidOrders.length > 0 ? (
                                        unpaidOrders.map(order => (
                                            <Card key={order.id} className="overflow-hidden">
                                                <CardHeader className="pb-2">
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <CardTitle>Order #{order.id}</CardTitle>
                                                            <CardDescription className="text-xs">
                                                                {format(new Date(order.created_at), 'PPP p')}
                                                            </CardDescription>
                                                        </div>
                                                        <Badge variant="secondary">Unpaid</Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pb-2">
                                                    <div className="mb-2">
                                                        <span className="text-sm font-medium">Customer: </span>
                                                        <span>{order.customer_name}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-medium">Items:</h4>
                                                        <ul className="text-sm space-y-1">
                                                            {order.order_items.map(item => (
                                                                <li key={item.id} className="flex justify-between">
                                                                    <span>{item.quantity}x {getMenuTitle(item.menu_id)}</span>
                                                                    <span>{formatPrice(parseFloat(item.subtotal.toString()))}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <Separator className="my-2" />
                                                    <div className="flex justify-between font-medium">
                                                        <span>Total:</span>
                                                        <span>{formatPrice(parseFloat(order.total_amount.toString()))}</span>
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="flex justify-between pt-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setCurrentOrder(order);
                                                            setIsViewDialogOpen(true);
                                                        }}
                                                    >
                                                        View Details
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleStatusChange(order.id, OrderStatus.PAID)}
                                                    >
                                                        <DollarSign className="h-4 w-4 mr-1" /> Mark Paid
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                                            <Receipt className="h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-xl font-semibold">No Unpaid Orders</h3>
                                            <p className="text-gray-500 mt-2">
                                                All orders have been paid
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Show pagination only if there are unpaid orders */}
                                {unpaidOrders && unpaidOrders.length > 0 && (
                                    <UnpaidPagination />
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};