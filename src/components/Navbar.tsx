'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heart, User, LogOut, BookOpen } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export function Navbar() {
  const { user, logout } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            哄哄模拟器
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-600 hover:text-pink-600">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">恋爱攻略</span>
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.username}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                >
                  注册
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
