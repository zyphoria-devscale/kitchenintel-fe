'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { TOKEN_KEY } from '@/lib/token';

// API URL
const API_URL = 'http://127.0.0.1:8000/api';

// Types based on your API
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
    image?: string;
};

// Pagination type
type PaginationResponse<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

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
    // Add mounted state to prevent hydration errors
    const [mounted, setMounted] = useState(false);

    const [menus, setMenus] = useState<Menu[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(9); // 3x3 grid

    // Mark component as mounted after initial render
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch menus with pagination
    const fetchMenus = async (page = 1) => {
        if (!mounted) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());

            if (selectedCategory) {
                params.append('category_id', selectedCategory);
            }
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            const token = localStorage.getItem(TOKEN_KEY);
            const url = `${API_URL}/menus/?${params.toString()}`;
            console.log(`Fetching menus from: ${url}`);

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch menus: ${response.status}`);
            }

            const data = await response.json();
            console.log('Menus API Response:', data);

            // Handle paginated response
            if (data.results && Array.isArray(data.results)) {
                const mappedMenus = data.results.map((menu: any) => ({
                    id: menu.id,
                    title: menu.title,
                    description: menu.description,
                    price: parseFloat(menu.price),
                    isRecommend: menu.is_recommend,
                    categoryId: menu.category_id,
                    image: 'https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                }));

                setMenus(mappedMenus);
                setTotalItems(data.count);
                const totalPgs = Math.ceil(data.count / pageSize);
                setTotalPages(totalPgs);
                setCurrentPage(page);
            } else if (Array.isArray(data)) {
                // Handle non-paginated response (fallback)
                const mappedMenus = data.map((menu: any) => ({
                    id: menu.id,
                    title: menu.title,
                    description: menu.description,
                    price: parseFloat(menu.price),
                    isRecommend: menu.is_recommend,
                    categoryId: menu.category_id,
                    image: 'https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                }));

                setMenus(mappedMenus);
                setTotalItems(data.length);
                setTotalPages(1);
                setCurrentPage(1);
            } else {
                console.error('Unexpected API response format:', data);
                setMenus([]);
                setTotalItems(0);
                setTotalPages(1);
            }

        } catch (error) {
            console.error('Error fetching menus:', error);
            toast.error('Failed to load menus');
            setMenus([]);
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
        fetchMenus(newPage);
    };

    // Fetch categories
    const fetchCategories = async () => {
        if (!mounted) return;

        setIsLoadingCategories(true);
        setCategoryError(null);
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_URL}/menu-categories/`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                }
            });
            console.log('Categories API Response:', response);
            if (response.ok) {
                const data = await response.json();

                // Handle paginated response for categories
                const categoryArray = data.results || data;

                if (Array.isArray(categoryArray)) {
                    const mappedCategories = categoryArray.map((cat: any) => ({
                        id: cat.id,
                        title: cat.title,
                        description: cat.description,
                        parentId: cat.parent_id
                    }));
                    setCategories(mappedCategories);
                } else {
                    setCategoryError('Invalid data format received from server');
                    setCategories([]);
                }
            } else {
                const errorMessage = `Failed to fetch categories: ${response.status}`;
                console.error(errorMessage);
                setCategoryError(errorMessage);
                setCategories([]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching categories:', error);
            setCategoryError(`Network error: ${errorMessage}`);
            setCategories([]);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    // Initial data loading
    useEffect(() => {
        if (mounted) {
            fetchMenus(1);
            fetchCategories();
        }
    }, [mounted]);

    // Update when filters change
    useEffect(() => {
        if (!mounted) return;
        fetchMenus(1); // Reset to first page when filters change
    }, [selectedCategory, mounted]);

    // Handle search with debounce
    useEffect(() => {
        if (!mounted) return;

        const delayDebounceFn = setTimeout(() => {
            fetchMenus(1); // Reset to first page when search changes
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, mounted]);

    // Handle sidebar state
    useEffect(() => {
        if (!mounted) return;

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
    }, [mounted]);

    // Get category name by ID
    const getCategoryName = (categoryId: string): string => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.title : '';
    };

    // Create a new menu
    const handleCreateMenu = async (data: MenuFormValues) => {
        try {
            toast.loading("Creating menu...");

            const menuData = {
                title: data.title,
                description: data.description || "",
                price: parseFloat(data.price),
                is_recommend: data.isRecommend,
                category_id: data.categoryId,
            };

            const token = localStorage.getItem(TOKEN_KEY)
            const response = await fetch(`${API_URL}/menus/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify(menuData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create menu');
            }

            const newMenu = await response.json();

            // Refresh the current page
            fetchMenus(currentPage);

            setIsCreateDialogOpen(false);
            toast.dismiss();
            toast.success("Menu created successfully");

        } catch (error) {
            toast.dismiss();
            toast.error(`Failed to create menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Error creating menu:', error);
        }
    };

    // Update existing menu
    const handleUpdateMenu = async (data: MenuFormValues) => {
        if (!currentMenu) return;

        try {
            toast.loading("Updating menu...");
            const token = localStorage.getItem(TOKEN_KEY)
            const menuData = {
                title: data.title,
                description: data.description || "",
                price: parseFloat(data.price.replace(/\./g, '')),
                is_recommend: data.isRecommend,
                category_id: data.categoryId,
            };

            const response = await fetch(`${API_URL}/menus/${currentMenu.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify(menuData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update menu');
            }

            // Refresh the current page
            fetchMenus(currentPage);

            setIsEditDialogOpen(false);
            setCurrentMenu(null);
            toast.dismiss();
            toast.success("Menu updated successfully");

        } catch (error) {
            toast.dismiss();
            toast.error(`Failed to update menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Error updating menu:', error);
        }
    };

    // Delete menu
    const handleDeleteMenu = async (menuId: string) => {
        try {
            toast.loading("Deleting menu...");
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_URL}/menus/${menuId}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                }
            });

            if (!response.ok) {
                let errorMessage = `Failed to delete menu (Status: ${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorMessage;
                } catch (e) {
                    errorMessage = `Failed to delete menu: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            // If we deleted the last item on a page, go back one page
            const updatedPage = menus.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
            fetchMenus(updatedPage);

            toast.dismiss();
            toast.success("Menu deleted successfully");

        } catch (error) {
            toast.dismiss();
            toast.error(`Failed to delete menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Error deleting menu:', error);
        }
    };

    // Pagination component
    const Pagination = () => {
        let pageNumbers = [];

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);

            if (currentPage > 3) {
                pageNumbers.push('...');
            }

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
                        <>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} menus</>
                    ) : (
                        <>No menus found</>
                    )}
                </div>
            </div>
        );
    };

    // Menu Form Component
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
                                let value = e.target.value.replace(/[^\d]/g, '');
                                value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                e.target.value = value;
                            }
                        })}
                        onBlur={(e) => {
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
                                categories.map((category) => (
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

                {/* <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                        id="image"
                        placeholder="Image URL (leave empty for default)"
                        {...form.register("image")}
                    />
                    <p className="text-xs text-gray-500">Leave empty to use a placeholder image</p>
                </div> */}

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

    // Use a client-only rendering approach for the main component
    if (!mounted) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-500">Loading menu management...</p>
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

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <p>Loading menus...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {menus.length > 0 ? (
                                menus.map((menu) => (
                                    <Card key={menu.id} className="overflow-hidden">
                                        <div className="relative h-48 w-full">
                                            <img
                                                src={menu.image}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};