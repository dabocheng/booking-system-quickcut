import { getServerSession } from "next-auth/next";
// 關鍵修正：直接引用我們抽出的 authOptions
import { authOptions } from "@/lib/auth";
import DesignerManager from "./DesignerManager";
import LogoutButton from "./LogoutButton";
import SharedScheduleViewer from "./SharedScheduleViewer";

function AdminDashboard() {
  return (
    <div className="space-y-8">
      <SharedScheduleViewer />
      <DesignerManager />
    </div>
  );
}

function DesignerDashboard() {
  return (
    <div className="space-y-8">
      <SharedScheduleViewer />
    </div>
  );
}

export default async function AdminPage() {
  // getServerSession 現在有了完整的型別上下文
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    // 理論上會被 middleware 擋住，但做個保險
    return <p>請先登入。</p>;
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-start bg-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">管理後台</h1>
            <p className="text-gray-600">
              {/* 現在這裡不應該再有任何紅線錯誤 */}
              登入身份: {session.user.email} ({session.user.role})
            </p>
          </div>
          <LogoutButton />
        </div>
        
        {session.user.role === 'ADMIN' ? <AdminDashboard /> : <DesignerDashboard />}
      </div>
    </div>
  );
}