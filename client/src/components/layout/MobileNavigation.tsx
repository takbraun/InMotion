import { Home, CheckSquare, Clock, Calendar, User } from "lucide-react";

export default function MobileNavigation() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex items-center justify-around">
        <button className="flex flex-col items-center space-y-1 text-primary">
          <Home className="w-5 h-5" />
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center space-y-1 text-gray-400">
          <CheckSquare className="w-5 h-5" />
          <span className="text-xs">Tasks</span>
        </button>
        <button className="flex flex-col items-center space-y-1 text-gray-400">
          <Clock className="w-5 h-5" />
          <span className="text-xs">Timer</span>
        </button>
        <button className="flex flex-col items-center space-y-1 text-gray-400">
          <Calendar className="w-5 h-5" />
          <span className="text-xs">Planning</span>
        </button>
        <button className="flex flex-col items-center space-y-1 text-gray-400">
          <User className="w-5 h-5" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </nav>
  );
}
