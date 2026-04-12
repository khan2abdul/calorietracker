import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel}></div>
            <div className="relative bg-[#141414] border border-white/5 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-red-500/10 p-2 rounded-2xl">
                        <AlertCircle className="text-red-500" size={24} />
                    </div>
                    <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 bg-[#1e1e1e] text-gray-300 font-bold rounded-xl text-sm transition-colors hover:bg-[#2a2a2a]"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-600/20 transition-transform active:scale-95"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
