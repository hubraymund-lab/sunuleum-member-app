// Created: 2026-03-18
export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = '확인', danger = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm}
            className={`flex-1 text-white py-2 rounded-lg transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {confirmLabel}
          </button>
          <button onClick={onCancel} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
        </div>
      </div>
    </div>
  );
}
