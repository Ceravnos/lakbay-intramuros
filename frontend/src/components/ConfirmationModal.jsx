import { X, AlertTriangle, Loader2 } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700',
    loading = false,
    icon: Icon = AlertTriangle,
    iconClass = 'text-red-500',
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-200">
                    <h3 className="font-semibold text-stone-800">{title}</h3>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-stone-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full bg-stone-100 ${iconClass}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-stone-700">{message}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 bg-stone-50 border-t border-stone-200">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-stone-700 font-medium rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${confirmButtonClass}`}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
