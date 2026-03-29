export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-gray-800">KosApp</h1>
        <p className="text-lg text-gray-600 mt-2">Platform pencarian dan iklan tempat kos terbaik</p>
      </div>
      <a
        href="/api/auth/signin"
        className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Login with Google
      </a>
    </main>
  );
}
