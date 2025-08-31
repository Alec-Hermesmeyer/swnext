// Simple Tailwind test page without any CSS modules
export default function TailwindDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            Tailwind CSS
          </div>
          <h1 className="block mt-1 text-lg leading-tight font-medium text-black">
            Successfully Working! 🎉
          </h1>
          <p className="mt-2 text-gray-500">
            This page proves Tailwind CSS is properly configured and working in your Next.js project.
          </p>
          
          <div className="mt-6 space-y-3">
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
            
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors">
              Hover me!
            </button>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
              <div className="h-8 bg-gray-400 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// This prevents the _app.js from wrapping this page with AdminLayout
TailwindDemo.getLayout = function getLayout(page) {
  return page
}