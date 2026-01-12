import React from "react";
import { X, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2pdf from "html2pdf.js";

const InvoiceModal2 = ({ bills, billsPerPage, globalSettings, onClose }) => {

    const calculateBillTotals = (bill) => {
        const { formData, items } = bill;
        const totalQuantity = (parseFloat(formData.quanrev) || 0) - (parseFloat(formData.dust) || 0);
        const itemTotal = items.reduce((acc, item) => acc + item.total, 0);

        const OPFP = globalSettings.includeDhara ? (itemTotal * 0.01).toFixed(0) : 0;
        const bankCharges = globalSettings.includeBankCharges ? 67 : 0;
        const sTotal = (itemTotal - parseFloat(OPFP) - parseFloat(bankCharges)).toFixed(0);

        const grandTotal =
            items.length ||
                formData.gst ||
                formData.be ||
                formData.tds2 ||
                formData.tds01 ||
                formData.dalla
                ? (
                    parseFloat(sTotal || "0") +
                    parseFloat(formData.gst || "0") -
                    parseFloat(formData.be || "0") -
                    parseFloat(formData.tds2 || "0") -
                    parseFloat(formData.tds01 || "0") -
                    parseFloat(formData.dalla || "0")
                ).toFixed(2)
                : "0.00";

        const endTotal = (parseFloat(formData.amount) || 0) - parseFloat(grandTotal);

        return { itemTotal, OPFP, bankCharges, grandTotal, endTotal, totalQuantity };
    };

    const handlePrint = () => {
        const printContents = document.getElementById("invoice-section")?.outerHTML;
        if (!printContents) return;

        const printWindow = window.open("", "_blank", "height=800,width=800");
        if (!printWindow) return;

        printWindow.document.write("<html><head><title>Invoice</title>");
        printWindow.document.write("<style>");
        printWindow.document.write(`
      @media print {
        @page { size: A4; margin: 0; }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', sans-serif;
          color: #000;
          background: #fff;
          width: 210mm;
          height: 297mm;
        }
        .no-print { display: none !important; }
        
        #invoice-section {
            width: 100%;
            height: 100%;
            display: grid;
            padding: 10mm;
            box-sizing: border-box;
            gap: 5mm; 
        }

        .bill-container {
            border: 1px solid #ddd;
            padding: 10px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* Grid Layouts */
        .grid-1 { grid-template-columns: 1fr; }
        .grid-2 { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
        .grid-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }

        /* Compact styles for multi-bill */
        .compact-mode h1, .compact-mode h2, .compact-mode h3 { margin: 2px 0; font-size: 14px; }
        .compact-mode p { margin: 1px 0; font-size: 10px; }
        .compact-mode table th, .compact-mode table td { padding: 2px 4px; font-size: 10px; }
        .compact-mode .text-xl { font-size: 12px; }
        .compact-mode .text-lg { font-size: 11px; }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 5px 0;
        }
        th, td {
          border: 1px solid #ddd;
          text-align: left;
          padding: 4px;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
      }
    `);
        printWindow.document.write("</style></head><body>");
        printWindow.document.write(printContents);
        printWindow.document.write("</body></html>");
        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById("invoice-section");
        if (!element) return;

        const firstBill = bills[0]?.formData;
        const formattedDate = firstBill?.date ? new Date(firstBill.date).toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }).split('/').join('.') : 'date';

        const partyName = firstBill?.partyName ? firstBill.partyName.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '') : 'Bills';
        // Add receiver name to filename if available
        const receiverName = firstBill?.billTo ? `_${firstBill.billTo.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '')}` : '';

        const filename = bills.length > 1 ? `Bills_${partyName}${receiverName}_${formattedDate}.pdf` : `${partyName}${receiverName}_${formattedDate}.pdf`;

        const opt = {
            margin: 0,
            filename: filename,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };

        html2pdf().set(opt).from(element).save();
    };

    // Determine grid class
    const gridClass = billsPerPage === 1 ? 'grid-cols-1' : billsPerPage === 2 ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2 grid-rows-2';
    const printGridClass = billsPerPage === 1 ? 'grid-1' : billsPerPage === 2 ? 'grid-2' : 'grid-4';

    // Determine if we need compact mode
    const isCompact = billsPerPage >= 2;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg shrink-0">
                    <h2 className="text-xl font-semibold">Invoice Preview ({bills.length} / {billsPerPage})</h2>
                    <div className="flex gap-2">
                        <Button onClick={handleDownloadPDF} size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                            <Download size={16} className="mr-2" /> Download PDF
                        </Button>
                        <Button onClick={handlePrint} size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                            <FileText size={16} className="mr-2" /> Print
                        </Button>
                        <Button onClick={onClose} size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                            <X size={16} />
                        </Button>
                    </div>
                </div>

                {/* Preview Area - simulate A4 aspect ratio if possible, or just scrollable */}
                <div className="overflow-auto flex-1 bg-gray-100 p-8 flex justify-center">
                    <div
                        id="invoice-section"
                        className={`bg-white shadow-lg grid gap-4 p-8 box-border ${gridClass} ${printGridClass} ${isCompact ? 'compact-mode' : ''}`}
                        style={{ width: '210mm', minHeight: '297mm', }}
                    >
                        {bills.map((bill, index) => {
                            const totals = calculateBillTotals(bill);
                            const { formData, items } = bill;

                            return (
                                <div key={bill.id} className="bill-container border border-gray-200 p-4 flex flex-col justify-between h-full bg-white relative">
                                    {/* Bill Content */}
                                    <div>
                                        {/* Header */}
                                        <div className="flex justify-between mb-4">
                                            <div className="w-1/2 pr-2">
                                                <div className="mb-2">
                                                    <h3 className="font-bold text-gray-700 text-xs">Bill From:</h3>
                                                    <p className="font-medium text-gray-900 text-sm whitespace-pre-wrap">{formData.partyName || "N/A"}</p>
                                                </div>
                                                {formData.billTo && (
                                                    <div>
                                                        <h3 className="font-bold text-gray-700 text-xs">Bill To:</h3>
                                                        <p className="font-medium text-gray-900 text-sm whitespace-pre-wrap">{formData.billTo}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right text-sm space-y-1 w-1/2 pl-2">
                                                <p><strong>Date:</strong> {formData.date ? new Date(formData.date).toLocaleDateString() : 'N/A'}</p>
                                                <p><strong>Vehicle:</strong> {formData.vehicleNumber || 'N/A'}</p>
                                                {formData.billNumber && <p><strong>Bill No:</strong> {formData.billNumber}</p>}
                                                {/* {formData.bill && <p><strong>Basic:</strong> ₹{formData.bill}</p>} */}
                                            </div>
                                        </div>

                                        {/* Weight Details */}
                                        {(formData.quanrev || formData.dust) && (
                                            <div className="mb-2 text-xs bg-gray-50 p-2 rounded">
                                                <strong>Weight:</strong> {formData.quanrev} - {formData.dust} = {totals.totalQuantity}
                                            </div>
                                        )}

                                        {/* Items Table */}
                                        <table className="w-full text-xs mb-4">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="p-1">#</th>
                                                    <th className="p-1">Qty</th>
                                                    <th className="p-1">Price</th>
                                                    <th className="p-1">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-1 border">{idx + 1}</td>
                                                        <td className="p-1 border">{item.quantity}</td>
                                                        <td className="p-1 border">₹{item.price}</td>
                                                        <td className="p-1 border">₹{item.total.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                {/* Fill empty rows if needed to maintain height? No, flex-grow handles it */}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Calculations footer */}
                                    <div className="text-xs space-y-1 border-t pt-2 mt-auto">
                                        <div className="flex justify-between"><span>Subtotal:</span> <span>₹{totals.itemTotal.toFixed(2)}</span></div>
                                        {globalSettings.includeDhara && <div className="flex justify-between"><span>Dhara (1%):</span> <span>-₹{totals.OPFP}</span></div>}
                                        {globalSettings.includeBankCharges && <div className="flex justify-between"><span>Bank Charges:</span> <span>-₹{totals.bankCharges}</span></div>}
                                        {formData.gst && <div className="flex justify-between"><span>GST:</span> <span>+₹{formData.gst}</span></div>}
                                        {/* Other deductions aggregated to save space if compact? or list all */}
                                        {formData.tds2 && <div className="flex justify-between"><span>Finance:</span> <span>-₹{formData.tds2}</span></div>}
                                        {formData.tds01 && <div className="flex justify-between"><span>TDS (0.1%):</span> <span>-₹{formData.tds01}</span></div>}
                                        {formData.be && <div className="flex justify-between"><span>B.E:</span> <span>-₹{formData.be}</span></div>}
                                        {formData.dalla && <div className="flex justify-between"><span>Dalla:</span> <span>-₹{formData.dalla}</span></div>}

                                        <hr className="my-1" />
                                        <div className="flex justify-between font-bold text-sm">
                                            <span>Grand Total:</span> <span>₹{totals.grandTotal}</span>
                                        </div>
                                        {formData.amount && (
                                            <>
                                                <div className="flex justify-between font-semibold"><span>Paid:</span> <span>₹{formData.amount}</span></div>
                                                <div className={`flex justify-between font-bold ${totals.endTotal < 0 ? "text-red-600" : "text-green-600"}`}>
                                                    <span>Balance:</span> <span>₹{totals.endTotal.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal2;
