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

type MenuFormValues = z.infer<typeof menuFormSchema>;

export const MenuManagement = () => {
    const [menus, setMenus] = useState<Menu[]>(mockMenus);
    const [categories, setCategories] = useState<MenuCategory[]>(mockCategories);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
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
        return category ? category.title : 'Unknown';
    };

    // Create a new menu
    const handleCreateMenu = (data: MenuFormValues) => {
        const newMenu: Menu = {
            id: (menus.length + 1).toString(),
            title: data.title,
            description: data.description || null,
            price: parseFloat(data.price),
            isRecommend: data.isRecommend,
            categoryId: data.categoryId,
            image: data.image || '/api/placeholder/800/450' // Default placeholder
        };

        setMenus([...menus, newMenu]);
        setIsCreateDialogOpen(false);
        toast.success("Menu created");
    };

    // Update existing menu
    const handleUpdateMenu = (data: MenuFormValues) => {
        if (!currentMenu) return;

        const updatedMenus = menus.map(menu => {
            if (menu.id === currentMenu.id) {
                return {
                    ...menu,
                    title: data.title,
                    description: data.description || null,
                    price: parseFloat(data.price),
                    isRecommend: data.isRecommend,
                    categoryId: data.categoryId,
                    image: data.image || menu.image
                };
            }
            return menu;
        });

        setMenus(updatedMenus);
        setIsEditDialogOpen(false);
        setCurrentMenu(null);
        toast.success("Menu updated");
    };

    // Delete menu
    const handleDeleteMenu = (menuId: string) => {
        const updatedMenus = menus.filter(menu => menu.id !== menuId);
        const menuToDelete = menus.find(menu => menu.id === menuId);

        setMenus(updatedMenus);
        toast.success("Menu deleted");
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
                        placeholder="0.00"
                        {...form.register("price")}
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
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.title}
                                </SelectItem>
                            ))}
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
                                        src={menu.image || '/api/placeholder/800/450'}
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
                                            ${menu.price.toFixed(2)}
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