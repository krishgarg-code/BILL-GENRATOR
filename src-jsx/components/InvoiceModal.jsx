import React from "react";
import { X, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2pdf from "html2pdf.js";

const InvoiceModal = ({ formData, items, calculations, onClose, bills, billsPerPage = 1 }) => {
  const { itemTotal, OPFP, grandTotal, endTotal, totalQuantity, bankCharges } =
    calculations || {};

  const includeDhara = formData?.includeDhara ?? true;
  const includeBankCharges = formData?.includeBankCharges ?? true;

  const calculateBillTotals = (bData, bItems) => {
    const bTotalQuantity = (parseFloat(bData.quanrev) || 0) - (parseFloat(bData.dust) || 0);
    const bItemTotal = bItems.reduce((acc, item) => acc + item.total, 0);
    const bOPFP = includeDhara ? (bItemTotal * 0.015).toFixed(0) : 0;
    const bBankCharges = includeBankCharges ? 67 : 0;
    const bSTotal = (bItemTotal - parseFloat(bOPFP) - parseFloat(bBankCharges)).toFixed(0);

    const bGrandTotal =
      bItems.length || bData.gst || bData.be || bData.tds2 || bData.tds01 || bData.dalla
        ? (
          parseFloat(bSTotal || "0") +
          parseFloat(bData.gst || "0") -
          parseFloat(bData.be || "0") -
          parseFloat(bData.tds2 || "0") -
          parseFloat(bData.tds01 || "0") -
          parseFloat(bData.dalla || "0")
        ).toFixed(2)
        : "0.00";

    const bEndTotal = (parseFloat(bData.amount) || 0) - parseFloat(bGrandTotal);

    return {
      itemTotal: bItemTotal,
      OPFP: bOPFP,
      bankCharges: bBankCharges,
      grandTotal: bGrandTotal,
      endTotal: bEndTotal,
      totalQuantity: bTotalQuantity
    };
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
        .grid-3 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
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

    // Use the first bill for naming if multi-bill
    const firstBill = isMultiBill && bills && bills[0] ? bills[0].formData : formData;

    // Format the date as DD-MM-YYYY
    const formattedDate = new Date(firstBill.date || new Date()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).split('/').join('.');

    // Create filename
    const partyName = (firstBill.partyName || 'Unknown').replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');
    const vehicleNumber = (firstBill.vehicleNumber || '').replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

    // Naming convention similar to InvoiceModal2
    const filename = isMultiBill
      ? `Bills_${partyName}_${formattedDate}.pdf` // Simplified for multi-bill
      : `${partyName}_${vehicleNumber}_${formattedDate}.pdf`;

    const opt = {
      margin: 0, // Zero margin as we handle it in CSS
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  const isMultiBill = billsPerPage > 1;

  if (isMultiBill) {
    // Grid logic matching InvoiceModal2
    const gridClass = billsPerPage === 2 ? "grid-cols-1 grid-rows-2" : "grid-cols-2 grid-rows-2";
    const printGridClass = billsPerPage === 2 ? "grid-2" : "grid-4";
    const isCompact = true;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg shrink-0">
            <h2 className="text-xl font-semibold">Multi-Invoice Preview ({billsPerPage} Bills)</h2>
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

          <div className="overflow-auto flex-1 bg-gray-100 p-8 flex justify-center">
            <div
              id="invoice-section"
              className={`bg-white shadow-lg grid gap-4 p-8 box-border ${gridClass} ${printGridClass} ${isCompact ? 'compact-mode' : ''}`}
              style={{ width: '210mm', minHeight: '297mm' }}
            >
              {bills && bills.slice(0, billsPerPage).map((bill, idx) => {
                const bData = bill.formData;
                const bItems = bill.items;
                const { itemTotal, OPFP, bankCharges, grandTotal, endTotal, totalQuantity } = calculateBillTotals(bData, bItems);

                return (
                  <div key={idx} className="bill-container border border-gray-200 p-4 flex flex-col justify-between h-full bg-white relative">
                    {/* Bill Content */}
                    <div>
                      {/* Compact Header */}
                      <div className="flex justify-between items-start border-b pb-2 mb-2">
                        <div>
                          <div className="font-bold text-lg md:text-xl line-clamp-1">{bData.partyName}</div>
                          <div className="font-semibold">{bData.vehicleNumber}</div>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <div>{bData.date ? new Date(bData.date).toLocaleDateString() : 'N/A'}</div>
                          {bData.billNumber && <div>No: {bData.billNumber}</div>}
                        </div>
                      </div>

                      {/* Weight Details Compact */}
                      {(bData.quanrev || bData.dust) && (
                        <div className="mb-2 p-1 bg-gray-50 rounded text-[10px]">
                          <strong>Weight:</strong> {bData.quanrev} - {bData.dust} = {totalQuantity}
                        </div>
                      )}

                      {/* Items Table */}
                      <div className="mb-2">
                        <table className="w-full text-[10px] border-collapse">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-1 text-left w-8">#</th>
                              <th className="p-1 text-right">Price</th>
                              <th className="p-1 text-right">Qty</th>
                              <th className="p-1 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bItems.map((item, i) => (
                              <tr key={i} className="border-b">
                                <td className="p-1">{i + 1}</td>
                                <td className="p-1 text-right">{item.price}</td>
                                <td className="p-1 text-right">{item.quantity}</td>
                                <td className="p-1 text-right">{item.total.toFixed(0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="text-xs space-y-1 border-t pt-2 mt-auto">
                      <div className="flex justify-between font-semibold">
                        <span>Subtotal:</span>
                        <span>{itemTotal.toFixed(0)}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-3 text-gray-600">
                        {includeDhara && <span>Dhara: -{OPFP}</span>}
                        {includeBankCharges && <span>Bank: -{bankCharges}</span>}
                        {bData.dalla && <span>Dalla: -{bData.dalla}</span>}
                        {bData.tds2 && <span>TDS(2%): -{bData.tds2}</span>}
                        {bData.tds01 && <span>TDS(0.1%): -{bData.tds01}</span>}
                        {bData.be && <span>BE: -{bData.be}</span>}
                      </div>

                      <hr className="my-1" />
                      <div className="flex justify-between font-bold text-sm">
                        <span>Total:</span>
                        <span>{grandTotal}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold bg-gray-50 p-1 rounded">
                        <span>Balance:</span>
                        <span className={endTotal < 0 ? "text-red-600" : "text-green-600"}>{endTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">Invoice Preview</h2>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadPDF}
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Download size={16} className="mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <FileText size={16} className="mr-2" />
              Print
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div id="invoice-section" className="p-8 bg-white text-black">
          {/* Company Header */}
          <div className="text-center mb-8">
            {/* <h1 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h1> */}
            {/* <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div> */}
          </div>

          {/* Invoice Details */}
          <div className="flex justify-between mb-8">
            <div className="w-1/3">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Bill From:
              </h3>
              <p className="text-xl font-medium text-gray-800">
                {formData.partyName}
              </p>
            </div>
            <div className="w-1/2 text-right space-y-2">
              <p><strong>Date:</strong> {new Date(formData.date).toLocaleDateString()}</p>
              <p><strong>Vehicle Number:</strong> {formData.vehicleNumber}</p>
              {formData.billNumber && (
                <p><strong>Bill No:</strong> {formData.billNumber}</p>
              )}
              {formData.bill && (
                <p><strong>Basic Price:</strong> ₹{formData.bill}</p>
              )}
            </div>
          </div>

          {/* Weight Details */}
          {(formData.quanrev || formData.dust) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">
                Weight Details:
              </h4>
              <p>
                <strong>Final Weight:</strong> {formData.quanrev} -{" "}
                {formData.dust} = {totalQuantity}
              </p>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Items</h4>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    #
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    Quantity
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    Price
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-4 py-3">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      ₹{item.price}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      ₹{item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations */}
          <div className="grid grid-cols-2 gap-8">
            <div></div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>
                  <strong>Subtotal:</strong>
                </span>
                <span>₹{itemTotal.toFixed(2)}</span>
              </div>
              {formData.includeDhara !== false && (
                <div className="flex justify-between">
                  <span>
                    <strong>Dhara (1.5%):</strong>
                  </span>
                  <span>-₹{OPFP}</span>
                </div>
              )}
              {formData.includeBankCharges !== false && (
                <div className="flex justify-between">
                  <span>
                    <strong>Bank Charges:</strong>
                  </span>
                  <span>-₹{bankCharges}</span>
                </div>
              )}
              {formData.gst && (
                <div className="flex justify-between">
                  <span>
                    <strong>GST:</strong>
                  </span>
                  <span>+₹{formData.gst}</span>
                </div>
              )}
              {formData.tds2 && (
                <div className="flex justify-between">
                  <span>
                    <strong>TDS (2%):</strong>
                  </span>
                  <span>-₹{formData.tds2}</span>
                </div>
              )}
              {formData.tds01 && (
                <div className="flex justify-between">
                  <span>
                    <strong>TDS (0.1%):</strong>
                  </span>
                  <span>-₹{formData.tds01}</span>
                </div>
              )}
              {formData.be && (
                <div className="flex justify-between">
                  <span>
                    <strong>B.E:</strong>
                  </span>
                  <span>-₹{formData.be}</span>
                </div>
              )}
              {formData.dalla && (
                <div className="flex justify-between">
                  <span>
                    <strong>Dalla:</strong>
                  </span>
                  <span>-₹{formData.dalla}</span>
                </div>
              )}

              <hr className="my-3" />

              {formData.amount ? (
                <>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Calculated Total:</span>
                    <span>₹{grandTotal}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Bill Amount:</span>
                    <span>₹{formData.amount}</span>
                  </div>
                  <div
                    className={`flex justify-between text-xl font-bold ${endTotal < 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    <span>Balance:</span>
                    <span>₹{endTotal.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-xl font-bold text-gray-800">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-gray-600">
            <p className="text-sm">Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
