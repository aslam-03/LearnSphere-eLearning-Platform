import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  GraduationCap,
  Menu,
  X,
  Shield,
  Users
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;
  
  // Different navigation based on user role
  const navItems = user?.role === 'admin' 
    ? [
        // Admin: Browse Courses first for all users
        { label: "Browse Courses", path: "/courses", icon: BookOpen },
        { label: "Admin Dashboard", path: "/admin", icon: Shield },
        { label: "Learner Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Manage Instructors", path: "/admin/instructors", icon: Users },
      ]
    : [
        // Non-admin users
        { label: "Browse Courses", path: "/courses", icon: BookOpen },
        ...(isAuthenticated ? [
          { label: "My Dashboard", path: "/dashboard", icon: LayoutDashboard },
        ] : []),
        ...(user?.role === "instructor" ? [
          { label: "Instructor Hub", path: "/instructor", icon: Settings },
        ] : []),
      ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          <div className="bg-primary text-white p-1.5 rounded-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span>LearnSphere</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={isActive(item.path) ? "secondary" : "ghost"}
                className={`gap-2 ${isActive(item.path) ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* User Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button className="font-semibold shadow-lg shadow-primary/20">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-primary"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white p-4 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={isActive(item.path) ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 mb-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
          <div className="pt-2 border-t">
            {isAuthenticated ? (
              <Button 
                variant="destructive" 
                className="w-full justify-start gap-2"
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            ) : (
              <Link href="/auth">
                <Button className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
