import BookingForm from './BookingForm';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-12 bg-slate-100">
      <div className="z-10 w-full max-w-2xl items-center justify-center text-center">
        <h1 className="text-4xl font-bold text-gray-800">
          Quick Cut 快速理髮
        </h1>
        <p className="mt-4 text-lg text-gray-600 mb-8">
          線上預約系統
        </p>
        <BookingForm />
      </div>
    </main>
  );
}