import React, { useState, useEffect, useMemo } from 'react';
import { getMemos, deleteMemo, getInvoices, deleteInvoice } from '../services/googleScriptMock';
import { MemoData, Invoice } from '../types';
import { useToast } from '../hooks/useToast';
import Card from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Input from './ui/Input';

interface MemoCRUDProps {
    onEditMemo: (memoNo: string) => void;
    onDownloadMemo: (memoNo: string) => void;
}

export const MemoCRUD: React.FC<MemoCRUDProps> = ({ onEditMemo, onDownloadMemo }) => {
    const [memos, setMemos] = useState<MemoData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [memoToDelete, setMemoToDelete] = useState<MemoData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getMemos();
            setMemos(data.sort((a, b) => b.trips_memo_no.localeCompare(a.trips_memo_no)));
        } catch (error) {
            addToast('Failed to fetch memos.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredData = useMemo(() => {
        if (!searchTerm) {
            return memos;
        }
        return memos.filter(memo =>
            memo.trips_memo_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            memo.customers_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [memos, searchTerm]);

    const openDeleteConfirmation = (memo: MemoData) => {
        setMemoToDelete(memo);
        setIsDeleteConfirmOpen(true);
    };

    const closeDeleteConfirmation = () => {
        setMemoToDelete(null);
        setIsDeleteConfirmOpen(false);
    };

    const handleDelete = async () => {
        if (memoToDelete) {
            setIsSubmitting(true);
            try {
                await deleteMemo(memoToDelete.trips_memo_no);
                addToast('Memo deleted successfully', 'success');
                await fetchData();
            } catch (error) {
                addToast('Failed to delete memo', 'error');
            } finally {
                setIsSubmitting(false);
                closeDeleteConfirmation();
            }
        }
    };

    const headers = ["Memo No", "Date", "Customer Name", "Vehicle No", "Balance", "Status", "Actions"];

    return (
        <Card title="Manage Memos">
            <div className="flex justify-between items-center mb-4">
                <Input
                    id="search"
                    label=""
                    placeholder="Search by Memo No or Customer..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-1/3"
                />
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Spinner /></div>
            ) : (
                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-gray-200 sticky top-0">
                            <tr>
                                {headers.map((header) => (
                                    <th key={header} className="px-4 py-2 text-left font-semibold text-gray-700">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((memo) => {
                                const status = memo.status || 'PENDING';
                                const statusColor = status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

                                return (
                                <tr key={memo.trips_memo_no} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{memo.trips_memo_no}</td>
                                    <td className="px-4 py-2">{memo.trip_operated_date1}</td>
                                    <td className="px-4 py-2">{memo.customers_name}</td>
                                    <td className="px-4 py-2">{memo.trips_vehicle_no}</td>
                                    <td className="px-4 py-2 text-right">{parseFloat(memo.trips_balance).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex space-x-4">
                                            <button onClick={() => onEditMemo(memo.trips_memo_no)} className="text-blue-600 hover:underline">Edit</button>
                                            <button onClick={() => onDownloadMemo(memo.trips_memo_no)} className="flex items-center text-green-600 hover:underline">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Download PDF
                                            </button>
                                            <button onClick={() => openDeleteConfirmation(memo)} className="text-red-600 hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
            
             {isDeleteConfirmOpen && memoToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
                        <p>Are you sure you want to delete memo <strong>{memoToDelete.trips_memo_no}</strong> for <strong>{memoToDelete.customers_name}</strong>? This action cannot be undone.</p>
                        <div className="flex justify-end mt-6 space-x-3">
                            <Button onClick={closeDeleteConfirmation} className="bg-gray-300 text-gray-800 hover:bg-gray-400">Cancel</Button>
                            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                                {isSubmitting ? <Spinner/> : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};


// --- NEW COMPONENT FOR MANAGING SUMMARY INVOICES ---

interface InvoiceCRUDProps {
    onDownloadInvoice: (invoiceId: number) => void;
}

export const InvoiceCRUD: React.FC<InvoiceCRUDProps> = ({ onDownloadInvoice }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getInvoices();
            setInvoices(data.sort((a, b) => b.invoice_no.localeCompare(a.invoice_no)));
        } catch (error) {
            addToast('Failed to fetch invoices.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

     useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openDeleteConfirmation = (invoice: Invoice) => {
        setInvoiceToDelete(invoice);
        setIsDeleteConfirmOpen(true);
    };

    const closeDeleteConfirmation = () => {
        setInvoiceToDelete(null);
        setIsDeleteConfirmOpen(false);
    };

    const handleDelete = async () => {
        if (invoiceToDelete && invoiceToDelete.id) {
            setIsSubmitting(true);
            try {
                await deleteInvoice(invoiceToDelete.id);
                addToast('Invoice deleted successfully', 'success');
                await fetchData();
            } catch (error) {
                addToast('Failed to delete invoice', 'error');
            } finally {
                setIsSubmitting(false);
                closeDeleteConfirmation();
            }
        }
    };

    const headers = ["Invoice No", "Date", "Customer Name", "Total Amount", "Actions"];
    
    return (
        <Card title="Manage Summary Invoices">
             {isLoading ? (
                <div className="flex justify-center items-center h-64"><Spinner /></div>
            ) : (
                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-gray-200 sticky top-0">
                            <tr>
                                {headers.map((header) => (
                                    <th key={header} className="px-4 py-2 text-left font-semibold text-gray-700">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{invoice.invoice_no}</td>
                                    <td className="px-4 py-2">{invoice.invoice_date}</td>
                                    <td className="px-4 py-2">{invoice.customer_name}</td>
                                    <td className="px-4 py-2 text-right">{parseFloat(invoice.total_amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex space-x-4">
                                            <button disabled className="text-gray-400 cursor-not-allowed">Edit</button>
                                            <button
                                                onClick={() => invoice.id && onDownloadInvoice(invoice.id)}
                                                className="text-green-600 hover:underline"
                                                disabled={!invoice.id}
                                            >
                                                Download
                                            </button>
                                            <button 
                                                onClick={() => openDeleteConfirmation(invoice)}
                                                className="text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isDeleteConfirmOpen && invoiceToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
                        <p>Are you sure you want to delete invoice <strong>{invoiceToDelete.invoice_no}</strong> for <strong>{invoiceToDelete.customer_name}</strong>? This action cannot be undone.</p>
                        <div className="flex justify-end mt-6 space-x-3">
                            <Button onClick={closeDeleteConfirmation} className="bg-gray-300 text-gray-800 hover:bg-gray-400">Cancel</Button>
                            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                                {isSubmitting ? <Spinner/> : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};