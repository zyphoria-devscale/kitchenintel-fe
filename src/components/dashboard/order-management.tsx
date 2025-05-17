'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, Receipt, ShoppingBag, ArrowRight, DollarSign } from 'lucide-react';
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

// Types based on your Prisma schema
enum OrderStatus {
    PAID = 'PAID',
    UNPAID = 'UNPAID'
}

type Menu = {
    id: string;
    title: string;
    price: number;
    categoryId: string;
};

type OrderItem = {
    id: string;
    quantity: number;
    priceAtOrderTime: number;
    subtotal: number;
    notes?: string;
    menuId: string;
    orderId: string;
    menu?: Menu;
};

type Order = {
    id: string;
    customerName: string;
    status: OrderStatus;
    totalAmount: number;
    orderItems: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
};

// Mock data for menus
const mockMenus: Menu[] = [
    { id: '1', title: 'Margherita Pizza', price: 12.99, categoryId: '1' },
    { id: '2', title: 'Chicken Wings', price: 9.99, categoryId: '2' },
    { id: '3', title: 'Tiramisu', price: 7.99, categoryId: '3' },
    { id: '4', title: 'Caesar Salad', price: 8.99, categoryId: '1' },
    { id: '5', title: 'Spaghetti Carbonara', price: 14.99, categoryId: '2' },
    { id: '6', title: 'Chocolate Cake', price: 6.99, categoryId: '3' },
];

// Mock data for orders
const mockOrders: Order[] = [
    {
        id: '1',
        customerName: 'John Doe',
        status: OrderStatus.PAID,
        totalAmount: 30.97,
        orderItems: [
            {
                id: '1',
                quantity: 1,
                priceAtOrderTime: 12.99,
                subtotal: 12.99,
                menuId: '1',
                orderId: '1',
                menu: mockMenus[0]
            },
            {
                id: '2',
                quantity: 2,
                priceAtOrderTime: 8.99,
                subtotal: 17.98,
                menuId: '4',
                orderId: '1',
                menu: mockMenus[3]
            }
        ],
        createdAt: new Date('2025-05-15T10:30:00'),
        updatedAt: new Date('2025-05-15T10:30:00')
    },
    {
        id: '2',
        customerName: 'Jane Smith',
        status: OrderStatus.UNPAID,
        totalAmount: 22.98,
        orderItems: [
            {
                id: '3',
                quantity: 1,
                priceAtOrderTime: 14.99,
                subtotal: 14.99,
                menuId: '5',
                orderId: '2',
                menu: mockMenus[4]
            },
            {
                id: '4',
                quantity: 1,
                priceAtOrderTime: 7.99,
                subtotal: 7.99,
                menuId: '3',
                orderId: '2',
                menu: mockMenus[2]
            }
        ],
        createdAt: new Date('2025-05-16T15:45:00'),
        updatedAt: new Date('2025-05-16T15:45:00')
    }
];

// Form schemas
const orderItemSchema = z.object({
    menuId: z.string().min(1, { message: "Menu item is required" }),
    quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
    notes: z.string().optional(),
});

const orderFormSchema = z.object({
    customerName: z.string().min(2, { message: "Customer name must be at least 2 characters" }),
    status: z.nativeEnum(OrderStatus),
    orderItems: z.array(orderItemSchema).min(1, { message: "At least one item is required" }),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export const OrderManagement = () => {
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [menus, setMenus] = useState<Menu[]>(mockMenus);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

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

    // Filter orders based on search term and status
    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ? true : order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Sort orders by creation date (newest first)
    const sortedOrders = [...filteredOrders].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

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

    // Calculate order total
    const calculateOrderTotal = (items: { menuId: string; quantity: number }[]): number => {
        return items.reduce((total, item) => {
            const price = getMenuPrice(item.menuId);
            return total + (price * item.quantity);
        }, 0);
    };

    // Create a new order
    const handleCreateOrder = (data: OrderFormValues) => {
        // Calculate subtotals and total amount
        const orderItems = data.orderItems.map((item, index) => {
            const price = getMenuPrice(item.menuId);
            const subtotal = price * item.quantity;

            return {
                id: `new-${index}`,
                quantity: item.quantity,
                priceAtOrderTime: price,
                subtotal: subtotal,
                notes: item.notes,
                menuId: item.menuId,
                orderId: `new-order`,
                menu: menus.find(menu => menu.id === item.menuId)
            };
        });

        const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

        const newOrder: Order = {
            id: (orders.length + 1).toString(),
            customerName: data.customerName,
            status: data.status,
            totalAmount: totalAmount,
            orderItems: orderItems,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        setOrders([...orders, newOrder]);
        setIsCreateDialogOpen(false);
        toast.success("Order created successfully");
    };

    // Update existing order
    const handleUpdateOrder = (data: OrderFormValues) => {
        if (!currentOrder) return;

        // Calculate subtotals and total amount
        const orderItems = data.orderItems.map((item, index) => {
            const price = getMenuPrice(item.menuId);
            const subtotal = price * item.quantity;

            // Try to find existing order item
            const existingItem = currentOrder.orderItems.find((oi, idx) => idx === index);

            return {
                id: existingItem ? existingItem.id : `new-${index}`,
                quantity: item.quantity,
                priceAtOrderTime: price,
                subtotal: subtotal,
                notes: item.notes,
                menuId: item.menuId,
                orderId: currentOrder.id,
                menu: menus.find(menu => menu.id === item.menuId)
            };
        });

        const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

        const updatedOrders = orders.map(order => {
            if (order.id === currentOrder.id) {
                return {
                    ...order,
                    customerName: data.customerName,
                    status: data.status,
                    totalAmount: totalAmount,
                    orderItems: orderItems,
                    updatedAt: new Date()
                };
            }
            return order;
        });

        setOrders(updatedOrders);
        setIsEditDialogOpen(false);
        setCurrentOrder(null);
        toast.success("Order updated successfully");
    };

    // Delete order
    const handleDeleteOrder = (orderId: string) => {
        const updatedOrders = orders.filter(order => order.id !== orderId);
        setOrders(updatedOrders);
        toast.success("Order deleted successfully");
    };

    // Update order status
    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        const updatedOrders = orders.map(order => {
            if (order.id === orderId) {
                return {
                    ...order,
                    status: newStatus,
                    updatedAt: new Date()
                };
            }
            return order;
        });

        setOrders(updatedOrders);
        toast.success(`Order status updated to ${newStatus}`);
    };

    // Order Form Component (for both create and edit)
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
                customerName: order.customerName,
                status: order.status,
                orderItems: order.orderItems.map(item => ({
                    menuId: item.menuId,
                    quantity: item.quantity,
                    notes: item.notes || ''
                }))
            } : {
                customerName: '',
                status: OrderStatus.UNPAID,
                orderItems: [{ menuId: '', quantity: 1, notes: '' }]
            }
        });

        const { fields, append, remove } = useFieldArray({
            control,
            name: "orderItems",
        });

        // Calculate subtotal for each item
        const calculateItemSubtotal = (menuId: string, quantity: number) => {
            const price = getMenuPrice(menuId);
            return price * quantity;
        };

        // Calculate total amount
        const orderItems = watch('orderItems');
        const totalAmount = orderItems.reduce((total, item) => {
            if (!item.menuId) return total;
            return total + calculateItemSubtotal(item.menuId, item.quantity || 0);
        }, 0);

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="customerName">Customer Name</Label>
                        <Input
                            id="customerName"
                            placeholder="Customer name"
                            {...register("customerName")}
                        />
                        {formState.errors.customerName && (
                            <p className="text-sm text-red-500">{formState.errors.customerName.message}</p>
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
                            onClick={() => append({ menuId: '', quantity: 1, notes: '' })}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Item
                        </Button>
                    </div>

                    {formState.errors.orderItems?.message && (
                        <p className="text-sm text-red-500">{formState.errors.orderItems.message}</p>
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
                                            <Label htmlFor={`orderItems.${index}.menuId`}>Menu Item</Label>
                                            <Select
                                                defaultValue={watch(`orderItems.${index}.menuId`) || undefined}
                                                onValueChange={(value) => setValue(`orderItems.${index}.menuId`, value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select menu item" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {menus.map((menu) => (
                                                        <SelectItem key={menu.id} value={menu.id}>
                                                            {menu.title} - ${menu.price.toFixed(2)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {formState.errors.orderItems?.[index]?.menuId && (
                                                <p className="text-sm text-red-500">
                                                    {formState.errors.orderItems[index]?.menuId?.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor={`orderItems.${index}.quantity`}>Qty</Label>
                                            <Input
                                                id={`orderItems.${index}.quantity`}
                                                type="number"
                                                min="1"
                                                {...register(`orderItems.${index}.quantity`, {
                                                    valueAsNumber: true,
                                                    min: 1
                                                })}
                                            />
                                            {formState.errors.orderItems?.[index]?.quantity && (
                                                <p className="text-sm text-red-500">
                                                    {formState.errors.orderItems[index]?.quantity?.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 md:col-span-4">
                                            <Label htmlFor={`orderItems.${index}.notes`}>Notes (Optional)</Label>
                                            <Input
                                                id={`orderItems.${index}.notes`}
                                                placeholder="e.g., No onions"
                                                {...register(`orderItems.${index}.notes`)}
                                            />
                                        </div>
                                    </div>

                                    {watch(`orderItems.${index}.menuId`) && (
                                        <div className="mt-2 text-right">
                                            <span className="text-sm text-gray-500">
                                                Subtotal: ${calculateItemSubtotal(
                                                    watch(`orderItems.${index}.menuId`),
                                                    watch(`orderItems.${index}.quantity`) || 0
                                                ).toFixed(2)}
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
                    <div className="text-lg font-bold">${totalAmount.toFixed(2)}</div>
                </div>

                <DialogFooter>
                    <Button type="submit">
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
                            Created: {format(new Date(order.createdAt), 'PPP p')}
                        </p>
                    </div>
                    <Badge variant="secondary" className={`${order.status === OrderStatus.PAID ? "bg-green-500 hover:bg-green-500 text-white" : ""}`}>
                        {order.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-medium mb-1">Customer</h4>
                        <p>{order.customerName}</p>
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
                            {order.orderItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div>
                                            <div>{item.menu?.title || getMenuTitle(item.menuId)}</div>
                                            {item.notes && (
                                                <div className="text-xs text-gray-500">Note: {item.notes}</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">${item.priceAtOrderTime.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                    <div className="text-lg font-semibold">Total Amount:</div>
                    <div className="text-lg font-bold">${order.totalAmount.toFixed(2)}</div>
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

    return (
        <div className={`transition-all duration-300 
            ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} 
            ${isMobile ? 'ml-0' : ''}`}
        >
            <div className="flex flex-col space-y-6 p-6 mx-auto max-w-7xl">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Order Management</h1>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Order
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>Create New Order</DialogTitle>
                                <DialogDescription>
                                    Add a new customer order with items from the menu.
                                </DialogDescription>
                            </DialogHeader>
                            <OrderForm onSubmit={handleCreateOrder} />
                        </DialogContent>
                    </Dialog>
                </div>

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
                </div>

                <Tabs defaultValue="all" className="w-full">
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
                                    {sortedOrders.length > 0 ? (
                                        sortedOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">#{order.id}</TableCell>
                                                <TableCell>{order.customerName}</TableCell>
                                                <TableCell>{order.orderItems.length} items</TableCell>
                                                <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={order.status === OrderStatus.PAID ? "default" : "secondary"}
                                                        className={`capitalize ${order.status === OrderStatus.PAID ? "bg-green-500 hover:bg-green-500" : ""}`}
                                                    >
                                                        {order.status.toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{format(new Date(order.createdAt), 'PP')}</TableCell>
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
                                                                {currentOrder && (
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
                                                                        Are you sure you want to delete order #{order.id} for {order.customerName}? This action cannot be undone.
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
                                                No orders found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="unpaid" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedOrders
                                .filter(order => order.status === OrderStatus.UNPAID)
                                .map(order => (
                                    <Card key={order.id} className="overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between">
                                                <div>
                                                    <CardTitle>Order #{order.id}</CardTitle>
                                                    <CardDescription className="text-xs">
                                                        {format(new Date(order.createdAt), 'PPP p')}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="secondary">Unpaid</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-2">
                                            <div className="mb-2">
                                                <span className="text-sm font-medium">Customer: </span>
                                                <span>{order.customerName}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-medium">Items:</h4>
                                                <ul className="text-sm space-y-1">
                                                    {order.orderItems.map(item => (
                                                        <li key={item.id} className="flex justify-between">
                                                            <span>{item.quantity}x {item.menu?.title || getMenuTitle(item.menuId)}</span>
                                                            <span>${item.subtotal.toFixed(2)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="flex justify-between font-medium">
                                                <span>Total:</span>
                                                <span>${order.totalAmount.toFixed(2)}</span>
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
                                ))}
                            {sortedOrders.filter(order => order.status === OrderStatus.UNPAID).length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                                    <Receipt className="h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-xl font-semibold">No Unpaid Orders</h3>
                                    <p className="text-gray-500 mt-2">
                                        All orders have been paid
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div >
    );
};