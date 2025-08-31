export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Tailwind Test Page
          </h1>
          <p className="text-gray-600 mb-6">
            If you can see this styled page, Tailwind CSS is working correctly!
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-500 h-16 rounded"></div>
            <div className="bg-green-500 h-16 rounded"></div>
            <div className="bg-blue-500 h-16 rounded"></div>
          </div>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Tailwind Button
          </button>
        </div>
      </div>
    </div>
  )
}