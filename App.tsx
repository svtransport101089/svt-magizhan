import React, { useState, useMemo } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';
import CustomerCRUD from './components/CustomerCRUD';
import ViewServices from './components/ViewServices';
import { MemoForm, InvoiceForm, CreateInvoicePage } from './components/forms/InvoiceForm';
import { ToastProvider } from './hooks/useToast';
import { Page } from './types';
import Dashboard from './components/Dashboard';
import AreasCRUD from './components/AreasCRUD';
import CalculationsCRUD from './components/CalculationsCRUD';
import { MemoCRUD, InvoiceCRUD } from './components/InvoiceCRUD';
import LookupCRUD from './components/LookupCRUD';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  
  // State for Memos
  const [editingMemoNo, setEditingMemoNo] = useState<string | null>(null);
  const [printOnLoad, setPrintOnLoad] = useState(false);

  // State for summary Invoices
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  
  const handleNavigate = (page: Page) => {
    setEditingMemoNo(null);
    setEditingInvoiceId(null);
    setPrintOnLoad(false);
    setCurrentPage(page);
  };

  const handleEditMemo = (memoNo: string) => {
    setEditingMemoNo(memoNo);
    setPrintOnLoad(false);
    setCurrentPage(Page.MEMO);
  };

  const handleDownloadMemo = (memoNo: string) => {
    setEditingMemoNo(memoNo);
    setPrintOnLoad(true);
    setCurrentPage(Page.MEMO);
  };

  const handleDownloadInvoice = (invoiceId: number) => {
    setEditingInvoiceId(invoiceId);
    setPrintOnLoad(true);
    setCurrentPage(Page.CREATE_INVOICE);
  };

  const handleMemoFormClose = () => {
    setEditingMemoNo(null);
    setPrintOnLoad(false);
    setCurrentPage(Page.MANAGE_MEMOS);
  };

  const handleInvoiceFormClose = () => {
    setEditingInvoiceId(null);
    setPrintOnLoad(false);
    setCurrentPage(Page.MANAGE_INVOICES);
  }

  const renderPage = useMemo(() => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return <Dashboard />;
      case Page.MEMO:
        return <MemoForm 
                  memoToLoad={editingMemoNo} 
                  onSaveSuccess={handleMemoFormClose}
                  onCancel={handleMemoFormClose} 
                  printOnLoad={printOnLoad}
                  onPrinted={handleMemoFormClose}
               />;
      case Page.MANAGE_MEMOS:
        return <MemoCRUD onEditMemo={handleEditMemo} onDownloadMemo={handleDownloadMemo} />;
      case Page.CREATE_INVOICE:
        if (editingInvoiceId) { // For downloading/viewing existing invoices
            return <InvoiceForm 
                      invoiceIdToLoad={editingInvoiceId} 
                      memoNosToLoad={[]}
                      onSaveSuccess={handleInvoiceFormClose} 
                      onCancel={handleInvoiceFormClose}
                      printOnLoad={printOnLoad}
                      onPrinted={handleInvoiceFormClose}
                    />;
        }
        return <CreateInvoicePage onSaveSuccess={handleInvoiceFormClose} />;
      case Page.MANAGE_INVOICES:
        return <InvoiceCRUD onDownloadInvoice={handleDownloadInvoice} />;
      case Page.MANAGE_CUSTOMERS:
        return <CustomerCRUD />;
      case Page.VIEW_ALL_SERVICES:
        return <ViewServices />;
      case Page.MANAGE_AREAS:
        return <AreasCRUD />;
      case Page.MANAGE_CALCULATIONS:
        return <CalculationsCRUD />;
      case Page.MANAGE_LOOKUP:
        return <LookupCRUD />;
      default:
        return <Dashboard />;
    }
  }, [currentPage, editingMemoNo, printOnLoad, editingInvoiceId]);

  const pageTitle = useMemo(() => {
    if (currentPage === Page.MEMO && editingMemoNo) {
      return printOnLoad ? `Download Memo: ${editingMemoNo}` : `Edit Memo: ${editingMemoNo}`;
    }
     if (currentPage === Page.CREATE_INVOICE) {
       if (printOnLoad && editingInvoiceId) {
         return `Download Invoice`;
       }
      return editingInvoiceId ? `Edit Invoice: ${editingInvoiceId}` : 'Create New Invoice';
    }
    const pageName = currentPage.replace(/_/g, ' ');
    return pageName.charAt(0).toUpperCase() + pageName.slice(1).toLowerCase();
  }, [currentPage, editingMemoNo, printOnLoad, editingInvoiceId]);


  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-100 font-sans">
        <Sidebar currentPage={currentPage} setCurrentPage={handleNavigate} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={pageTitle} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <PageWrapper>
              {renderPage}
            </PageWrapper>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default App;