'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import toast from 'react-hot-toast';

// Types based on your Prisma schema
type MenuCategory = {
    id: string;
    title: string;
    description: string | null;
    parentId: string | null;
};

type Menu = {
    id: string;
    title: string;
    description: string | null;
    price: number;
    isRecommend: boolean;
    categoryId: string;
    category?: MenuCategory;
    image?: string; // For image URL
};

// Mock data for demonstration
const mockCategories: MenuCategory[] = [
    { id: '1', title: 'Appetizers', description: 'Starters and small plates', parentId: null },
    { id: '2', title: 'Main Courses', description: 'Primary dishes', parentId: null },
    { id: '3', title: 'Desserts', description: 'Sweet treats', parentId: null },
    { id: '4', title: 'Beverages', description: 'Drinks', parentId: null },
    { id: '5', title: 'Italian Mains', description: 'Italian specialty dishes', parentId: '2' },
];

const mockMenus: Menu[] = [
    {
        id: '1',
        title: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and basil',
        price: 12.99,
        isRecommend: true,
        categoryId: '5',
        image: '/image/main-dish.jpg'
    },
    {
        id: '2',
        title: 'Chicken Wings',
        description: 'Spicy buffalo wings served with blue cheese dip',
        price: 9.99,
        isRecommend: false,
        categoryId: '1',
        image: '/image/beverages.jpg'
    },
    {
        id: '3',
        title: 'Tiramisu',
        description: 'Italian coffee-flavored dessert',
        price: 7.99,
        isRecommend: true,
        categoryId: '3',
        image: '/image/desserts.jpg'
    },
    {
        id: '4',
        title: 'Chicken Wings',
        description: 'Spicy buffalo wings served with blue cheese dip',
        price: 9.99,
        isRecommend: false,
        categoryId: '1',
        image: '/image/beverages.jpg'
    },
    {
        id: '5',
        title: 'Tiramisu',
        description: 'Italian coffee-flavored dessert',
        price: 7.99,
        isRecommend: true,
        categoryId: '3',
        image: '/image/desserts.jpg'
    },
];

// Form schema
const menuFormSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    description: z.string().optional(),

    price: z.string().refine((val: string) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Price must be a positive number"
    }),
    isRecommend: z.boolean(),
    categoryId: z.string().min(1, { message: "Category is required" }),
    image: z.string().optional()
});

type MenuManagementProps = {
    menuList: {
        id: string;
        title: string;
        description: string | null;
        price: any; // Using 'any' for Decimal type compatibility
        isRecommend: boolean;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
};

type MenuFormValues = z.infer<typeof menuFormSchema>;

export const MenuManagement = ({ menuList }: MenuManagementProps) => {
    const [menus, setMenus] = useState<Menu[]>(menuList || []);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Filter menus based on search term and category
    const filteredMenus = menus.filter(menu => {
        const matchesSearch = menu.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            menu.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? menu.categoryId === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    useEffect(() => {
        // Map database fields to component state fields if needed
        if (menuList && menuList.length > 0) {
            const mappedMenus = menuList.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                price: parseFloat(item.price.toString()), // Convert Decimal to number
                isRecommend: item.isRecommend, // Make sure this matches your DB field
                categoryId: item.categoryId,
                image: '/api/placeholder/800/450' // Default image as your DB might not have images
            }));

            setMenus(mappedMenus);
        }
    }, [menuList]);

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            setCategoryError(null);
            try {
                const response = await fetch('http://127.0.0.1:8000/api/menu-categories/');
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        // Map the API response to your category structure
                        const mappedCategories = data.map(cat => ({
                            id: cat.id,
                            title: cat.title,
                            description: cat.description,
                            parentId: cat.parent_id
                        }));
                        setCategories(mappedCategories);
                    } else {
                        setCategoryError('Invalid data format received from server');
                        setCategories([]); // Just use empty array, not mock data
                    }
                } else {
                    const errorMessage = `Failed to fetch categories: ${response.status}`;
                    console.error(errorMessage);
                    setCategoryError(errorMessage);
                    setCategories([]); // Just use empty array, not mock data
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error('Error fetching categories:', error);
                setCategoryError(`Network error: ${errorMessage}`);
                setCategories([]); // Just use empty array, not mock data
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

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

    // Get category name by ID
    const getCategoryName = (categoryId: string): string => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.title : '';
    };

    // Create a new menu
    const handleCreateMenu = async (data: MenuFormValues) => {
        try {
            // Show loading state
            toast.loading("Creating menu...");

            // Prepare the data in the format your Django API expects
            const menuData = {
                title: data.title,
                description: data.description || "",
                price: parseFloat(data.price),
                is_recommended: data.isRecommend,  // This is now correct
                category_id: data.categoryId,
            };

            // Make the API call to your Django backend
            const response = await fetch('http://127.0.0.1:8000/api/menus/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include authentication if your API requires it
                    // 'Authorization': 'Bearer your-token-here'
                },
                body: JSON.stringify(menuData)
            });

            // Check if the request was successful
            if (!response.ok) {
                // Convert non-2xx HTTP responses into errors
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create menu');
            }

            // Get the newly created menu from the response
            const newMenu = await response.json();

            // Update the local state with the new menu from the server
            setMenus([...menus, {
                id: newMenu.id,
                title: newMenu.title,
                description: newMenu.description,
                price: newMenu.price,
                isRecommend: newMenu.is_recommend,
                categoryId: newMenu.category_id,
                // image: newMenu.image
            }]);

            // Close the dialog and show success message
            setIsCreateDialogOpen(false);
            toast.dismiss(); // Remove loading toast
            toast.success("Menu created successfully");

        } catch (error) {
            // Handle any errors
            toast.dismiss(); // Remove loading toast
            toast.error(`Failed to create menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Error creating menu:', error);
        }
    };

    // Update existing menu
    const handleUpdateMenu = async (data: MenuFormValues) => {
        if (!currentMenu) return;

        try {
            // Show loading state
            toast.loading("Updating menu...");

            // Prepare the data in the format your Django API expects
            const menuData = {
                title: data.title,
                description: data.description || "",
                price: parseFloat(data.price.replace(/\./g, '')), // Remove dot separators
                is_recommend: data.isRecommend,
                category_id: data.categoryId,
            };

            // Make the API call to your Django backend
            const response = await fetch(`http://127.0.0.1:8000/api/menus/${currentMenu.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // Include authentication if your API requires it
                    // 'Authorization': 'Bearer your-token-here'
                },
                body: JSON.stringify(menuData)
            });

            // Check if the request was successful
            if (!response.ok) {
                // Convert non-2xx HTTP responses into errors
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update menu');
            }

            // Get the updated menu from the response
            const updatedMenu = await response.json();

            // Update the local state with the updated menu
            const updatedMenus = menus.map(menu => {
                if (menu.id === currentMenu.id) {
                    return {
                        id: updatedMenu.id,
                        title: updatedMenu.title,
                        description: updatedMenu.description,
                        price: parseFloat(updatedMenu.price.toString()),
                        isRecommend: updatedMenu.is_recommend,
                        categoryId: updatedMenu.category_id,
                        image: menu.image // Preserve the image URL from the existing menu
                    };
                }
                return menu;
            });

            setMenus(updatedMenus);
            setIsEditDialogOpen(false);
            setCurrentMenu(null);

            // Show success message
            toast.dismiss(); // Remove loading toast
            toast.success("Menu updated successfully");

        } catch (error) {
            // Handle any errors
            toast.dismiss(); // Remove loading toast
            toast.error(`Failed to update menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Error updating menu:', error);
        }
    };

    // Delete menu
    const handleDeleteMenu = async (menuId: string) => {
        try {
            // Show loading state
            toast.loading("Deleting menu...");

            // Make the API call to your Django backend
            const response = await fetch(`http://127.0.0.1:8000/api/menus/${menuId}/`, {
                method: 'DELETE',
                headers: {
                    // Include authentication if your API requires it
                    // 'Authorization': 'Bearer your-token-here'
                },
            });

            // Check if the request was successful (DELETE typically returns 204 No Content)
            if (!response.ok) {
                // For DELETE requests, some APIs might not return JSON
                let errorMessage = `Failed to delete menu (Status: ${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorMessage;
                } catch (e) {
                    // If response is not JSON, use the status text
                    errorMessage = `Failed to delete menu: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            // Update the local state by removing the deleted menu
            const updatedMenus = menus.filter(menu => menu.id !== menuId);
            setMenus(updatedMenus);

            // Show success message
            toast.dismiss(); // Remove loading toast
            toast.success("Menu deleted successfully");

        } catch (error) {
            // Handle any errors
            toast.dismiss(); // Remove loading toast
            toast.error(`Failed to delete menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Error deleting menu:', error);
        }
    };

    // Menu Form Component (for both create and edit)
    const MenuForm = ({
        menu,
        onSubmit
    }: {
        menu?: Menu,
        onSubmit: (data: MenuFormValues) => void
    }) => {
        const form = useForm<MenuFormValues>({
            resolver: zodResolver(menuFormSchema),
            defaultValues: menu ? {
                title: menu.title,
                description: menu.description || '',
                price: menu.price.toString(),
                isRecommend: menu.isRecommend,
                categoryId: menu.categoryId,
                image: menu.image
            } : {
                title: '',
                description: '',
                price: '',
                isRecommend: false,
                categoryId: '',
                image: '/api/placeholder/800/450'
            }
        });

        return (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Menu Title</Label>
                    <Input
                        id="title"
                        placeholder="e.g., Chicken Parmesan"
                        {...form.register("title")}
                    />
                    {form.formState.errors.title && (
                        <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Describe your menu item..."
                        {...form.register("description")}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                        id="price"
                        placeholder="20.000"
                        {...form.register("price", {
                            onChange: (e) => {
                                // Remove non-numeric characters
                                let value = e.target.value.replace(/[^\d]/g, '');
                                // Format with thousand separators (dots)
                                value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                // Update the input value
                                e.target.value = value;
                            }
                        })}
                        onBlur={(e) => {
                            // On blur, ensure there's a valid number for form validation
                            const numericValue = e.target.value.replace(/\./g, '');
                            form.setValue('price', numericValue, { shouldValidate: true });
                        }}
                    />
                    {form.formState.errors.price && (
                        <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                        defaultValue={form.getValues("categoryId")}
                        onValueChange={(value) => form.setValue("categoryId", value)}
                        disabled={isLoadingCategories}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoadingCategories ? (
                                <SelectItem value="loading" disabled>
                                    Loading categories...
                                </SelectItem>
                            ) : categories.length > 0 ? (
                                categories.filter(item => item.parentId !== null).map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.title}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="empty" disabled>
                                    No categories available
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.categoryId && (
                        <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                        id="image"
                        placeholder="Image URL (leave empty for default)"
                        {...form.register("image")}
                    />
                    <p className="text-xs text-gray-500">Leave empty to use a placeholder image</p>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="isRecommend"
                        checked={form.watch("isRecommend")}
                        onCheckedChange={(checked) => form.setValue("isRecommend", checked)}
                    />
                    <Label htmlFor="isRecommend">Recommended Item</Label>
                </div>

                <DialogFooter>
                    <Button type="submit">
                        {menu ? 'Update Menu' : 'Create Menu'}
                    </Button>
                </DialogFooter>
            </form>
        );
    };

    return (
        <div className={`transition-all duration-300 
            ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} 
            ${isMobile ? 'ml-0' : ''}`}
        >
            <div className="flex flex-col space-y-6 p-6 mx-auto max-w-7xl">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Menu Management</h1>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Menu Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create New Menu Item</DialogTitle>
                                <DialogDescription>
                                    Add a new item to your restaurant menu.
                                </DialogDescription>
                            </DialogHeader>
                            <MenuForm onSubmit={handleCreateMenu} />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            type="search"
                            placeholder="Search menus..."
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

                    <Select
                        value={selectedCategory || 'all'}
                        onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
                    >
                        <SelectTrigger className="w-full md:w-72">
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMenus.length > 0 ? (
                        filteredMenus.map((menu) => (
                            <Card key={menu.id} className="overflow-hidden">
                                <div className="relative h-48 w-full">
                                    <img
                                        src={'https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                                        alt={menu.title}
                                        className="object-cover w-full h-full"
                                    />
                                    {menu.isRecommend && (
                                        <Badge className="absolute top-2 right-2 bg-amber-500">
                                            Recommended
                                        </Badge>
                                    )}
                                </div>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{menu.title}</CardTitle>
                                            <CardDescription className="text-xs">
                                                Category: {getCategoryName(menu.categoryId)}
                                            </CardDescription>
                                        </div>
                                        <div className="font-bold text-xl">
                                            Rp {menu.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600">
                                        {menu.description || 'No description available.'}
                                    </p>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Dialog open={isEditDialogOpen && currentMenu?.id === menu.id} onOpenChange={(open) => {
                                        setIsEditDialogOpen(open);
                                        if (!open) setCurrentMenu(null);
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setCurrentMenu(menu);
                                                    setIsEditDialogOpen(true);
                                                }}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Edit Menu Item</DialogTitle>
                                                <DialogDescription>
                                                    Update details for {menu.title}.
                                                </DialogDescription>
                                            </DialogHeader>
                                            {currentMenu && currentMenu.id === menu.id && (
                                                <MenuForm menu={currentMenu} onSubmit={handleUpdateMenu} />
                                            )}
                                        </DialogContent>
                                    </Dialog>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete {menu.title} from your menu. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteMenu(menu.id)}>
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                            <span className="text-4xl mb-4">🍽️</span>
                            <h3 className="text-xl font-semibold">No menu items found</h3>
                            <p className="text-gray-500 mt-2">
                                {searchTerm || selectedCategory
                                    ? "Try adjusting your search or filter criteria"
                                    : "Start by adding your first menu item"
                                }
                            </p>
                            {(searchTerm || selectedCategory) && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory(null);
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};