import { Users, MessageSquare, ShoppingCart, Shield, Activity, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value="1,234"
            icon={<Users className="w-6 h-6" />}
            trend="+12%"
          />
          <StatCard
            title="Active Chats"
            value="567"
            icon={<MessageSquare className="w-6 h-6" />}
            trend="+8%"
          />
          <StatCard
            title="Marketplace Items"
            value="89"
            icon={<ShoppingCart className="w-6 h-6" />}
            trend="+15%"
          />
          <StatCard
            title="Flagged Content"
            value="12"
            icon={<Shield className="w-6 h-6" />}
            trend="-5%"
          />
          <StatCard
            title="Revenue"
            value="$4,567"
            icon={<DollarSign className="w-6 h-6" />}
            trend="+23%"
          />
          <StatCard
            title="Server Status"
            value="Online"
            icon={<Activity className="w-6 h-6" />}
            trend="100%"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionButton label="User Management" href="/users" />
            <ActionButton label="Moderation Queue" href="/moderation" />
            <ActionButton label="Verifications" href="/verifications" />
            <ActionButton label="Analytics" href="/analytics" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-500">{icon}</div>
        <span className="text-sm text-green-600 font-medium">{trend}</span>
      </div>
      <h3 className="text-2xl font-bold mb-1">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </div>
  );
}

function ActionButton({ label, href }: any) {
  return (
    <a
      href={href}
      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg text-center transition-colors"
    >
      {label}
    </a>
  );
}
