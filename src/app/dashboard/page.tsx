import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Boards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Board cards will go here */}
            <Link
              href="/board/new"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 flex flex-col items-center justify-center min-h-[200px]"
            >
              <svg
                className="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-sm font-medium text-gray-600">Create New Board</span>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded mb-3"></div>
              <h3 className="font-medium text-gray-900">Sprint Planning</h3>
              <p className="text-sm text-gray-500">Plan your next sprint</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="h-32 bg-gradient-to-br from-green-100 to-green-200 rounded mb-3"></div>
              <h3 className="font-medium text-gray-900">Mind Map</h3>
              <p className="text-sm text-gray-500">Organize your thoughts</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded mb-3"></div>
              <h3 className="font-medium text-gray-900">User Journey</h3>
              <p className="text-sm text-gray-500">Map user experiences</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="h-32 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded mb-3"></div>
              <h3 className="font-medium text-gray-900">Kanban Board</h3>
              <p className="text-sm text-gray-500">Track your tasks</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}