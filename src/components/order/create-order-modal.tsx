import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TOKEN_KEY } from '@/lib/token';

const API_URL = 'http://127.0.0.1:8000/api';

interface MenuItem {
    id: string;
    title: string;
    price: string;
    description?: string;
    category_id: string;
    is_recommend: boolean;
}

interface OrderItem {
    id: number;
    menu_id: string;
    quantity: number;
    notes: string;
}

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [customerName, setCustomerName] = useState('');
    const [orderStatus, setOrderStatus] = useState('UNPAID');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([
        { id: 1, menu_id: '', quantity: 1, notes: '' }
    ]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);

    // Fetch menu items from API
    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setLoading(true);

                // Fetch all pages of menu items
                let allMenuItems: MenuItem[] = [];
                let currentPage = 1;
                let hasNextPage = true;

                while (hasNextPage) {
                    const response = await fetch(`${API_URL}/menus/?page=${currentPage}`);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch menu items: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log(`Fetched menu items page ${currentPage}:`, data);

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
                        setMenuItems([]);
                        alert('Invalid menu data format received from server');
                        return;
                    }
                }

                console.log(`Total menu items fetched: ${allMenuItems.length}`);
                setMenuItems(allMenuItems);

            } catch (error) {
                console.error('Error fetching menu items:', error);
                alert('Failed to load menu items. Please try again.');
                setMenuItems([]); // Set empty array on error
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchMenuItems();
        }
    }, [isOpen]);

    // Calculate total amount whenever order items change
    useEffect(() => {
        const total = orderItems.reduce((sum, item) => {
            const menuItem = menuItems.find((menu: MenuItem) => menu.id === item.menu_id);
            if (menuItem && item.quantity > 0) {
                return sum + (parseFloat(menuItem.price) * item.quantity);
            }
            return sum;
        }, 0);
        setTotalAmount(total);
    }, [orderItems, menuItems]);

    const addItem = () => {
        const newItem: OrderItem = {
            id: Date.now(),
            menu_id: '',
            quantity: 1,
            notes: ''
        };
        setOrderItems([...orderItems, newItem]);
    };

    const removeItem = (itemId: number) => {
        if (orderItems.length > 1) {
            setOrderItems(orderItems.filter(item => item.id !== itemId));
        }
    };

    const updateItem = (itemId: number, field: keyof OrderItem, value: string | number) => {
        setOrderItems(orderItems.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
        ));
    };

    const resetForm = () => {
        setCustomerName('');
        setOrderStatus('UNPAID');
        setOrderItems([{ id: 1, menu_id: '', quantity: 1, notes: '' }]);
        setTotalAmount(0);
    };

    const handleSubmit = async () => {
        // Validation
        if (!customerName.trim()) {
            alert('Please enter customer name');
            return;
        }

        const validItems = orderItems.filter(item => item.menu_id && item.quantity > 0);
        if (validItems.length === 0) {
            alert('Please select at least one menu item');
            return;
        }

        try {
            const orderData = {
                customer_name: customerName.trim(),
                status: orderStatus,
                items: validItems.map(item => ({
                    menu_id: item.menu_id,
                    quantity: parseInt(item.quantity.toString()),
                    notes: item.notes.trim() || ''
                }))
            };

            console.log('Submitting order data:', orderData);
    
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_URL}/orders-with-items/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Order created successfully:', result);

                // Reset form
                resetForm();

                // Call success callback to refresh parent data
                if (onSuccess) {
                    onSuccess();
                }

                onClose();
                alert('Order created successfully!');
            } else {
                const errorData = await response.json();
                console.error('Error creating order:', errorData);

                // Handle specific error messages
                if (errorData.customer_name) {
                    alert(`Customer name error: ${errorData.customer_name.join(', ')}`);
                } else if (errorData.items) {
                    alert(`Items error: ${JSON.stringify(errorData.items)}`);
                } else {
                    alert('Failed to create order. Please check the form data.');
                }
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Network error. Please check your connection and try again.');
        }
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Create New Order</DialogTitle>
                    <DialogDescription>
                        Add a new customer order with items from the menu.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_name">Customer Name *</Label>
                            <Input
                                id="customer_name"
                                type="text"
                                placeholder="Customer name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="order_status">Order Status</Label>
                            <Select
                                value={orderStatus}
                                onValueChange={(value) => setOrderStatus(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-lg font-medium">Order Items</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addItem}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>

                        {loading && (
                            <div className="text-center py-4">
                                <p className="text-gray-500">Loading menu items...</p>
                            </div>
                        )}

                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {orderItems.map((item, index) => (
                                    <Card key={item.id} className="p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-medium">Item #{index + 1}</h4>
                                            {orderItems.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <X className="h-4 w-4 text-red-500" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="space-y-2 md:col-span-6">
                                                <Label htmlFor={`menu_item_${item.id}`}>Menu Item *</Label>
                                                <Select
                                                    value={item.menu_id}
                                                    onValueChange={(value) => updateItem(item.id, 'menu_id', value)}
                                                    disabled={loading}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select menu item" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {menuItems.map((menuItem) => (
                                                            <SelectItem key={menuItem.id} value={menuItem.id}>
                                                                {menuItem.title} - {formatPrice(parseFloat(menuItem.price))}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor={`quantity_${item.id}`}>Qty *</Label>
                                                <Input
                                                    id={`quantity_${item.id}`}
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2 md:col-span-4">
                                                <Label htmlFor={`notes_${item.id}`}>Notes (Optional)</Label>
                                                <Input
                                                    id={`notes_${item.id}`}
                                                    type="text"
                                                    placeholder="e.g. No onions"
                                                    value={item.notes}
                                                    onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {item.menu_id && (
                                            <div className="mt-2 text-right">
                                                <span className="text-sm text-gray-600">
                                                    Subtotal: {formatPrice(
                                                        parseFloat(menuItems.find(menu => menu.id === item.menu_id)?.price || '0') * item.quantity
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>

                        {!loading && menuItems.length === 0 && (
                            <div className="text-center py-4">
                                <p className="text-gray-500">No menu items available</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-lg font-semibold">
                        Total Amount: {formatPrice(totalAmount)}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!customerName || orderItems.filter(item => item.menu_id).length === 0 || loading}
                        >
                            Create Order
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateOrderModal;