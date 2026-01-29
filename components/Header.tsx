import React from "react";
import { Menu, Bell, RefreshCw } from "lucide-react";
import { User, AppNotification } from "../types";

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  currentUser: User;
  visibleNotifications?: AppNotification[];
  onBellClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  title,
  currentUser,
  visibleNotifications = [],
  onBellClick,
}) => {
  const handleRefresh = () => {
    window.location.reload();
  };
  const unreadCount = visibleNotifications.filter(
    (n) => !n.readBy?.includes(currentUser.id),
  ).length;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="flex items-center gap-3 lg:gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 rounded-xl lg:hidden hover:bg-slate-100 active:scale-95 transition-transform"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg lg:text-xl font-bold text-slate-800 capitalize tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="flex items-center gap-3">
          {/* Refresh Button - Added before notification bell */}
          <button
            onClick={handleRefresh}
            className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90 group"
            title="Refresh page"
          >
            <RefreshCw
              size={20}
              className="group-hover:rotate-180 transition-transform duration-500"
            />
          </button>
          <button
            onClick={onBellClick}
            className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 pl-2">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-700 leading-none">
                {currentUser.name}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                {currentUser.role.replace("_", " ")}
              </p>
            </div>
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-indigo-600 font-bold text-sm">
              {currentUser.photo ? (
                <img
                  src={currentUser.photo}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
