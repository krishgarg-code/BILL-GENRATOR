import React from "react";
import { X, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2pdf from "html2pdf.js";

const InvoiceModal = ({ formData, items, calculations, onClose }) => {
  const { itemTotal, OPFP, grandTotal, endTotal, totalQuantity, bankCharges } =
    calculations;

  const handlePrint = () => {
    const printContents = document.getElementById("invoice-section")?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open("", "_blank", "height=800,width=800");
    if (!printWindow) return;

    printWindow.document.write("<html><head><title>Invoice</title>");
    printWindow.document.write("<style>");
    printWindow.document.write(`
      @media print {
        @page { margin: 0; }
        body {
          margin: 0;
          padding: 40px;
          font-family: 'Segoe UI', sans-serif;
          color: #000;
          background: #fff;
        }
        .no-print { display: none !important; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 12px 8px;
          border: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        h1, h2, h3, h4, p { margin: 8px 0; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #333; }
        .invoice-title { font-size: 20px; margin: 10px 0; }
        .totals { margin-top: 20px; }
        .grand-total { font-size: 18px; font-weight: bold; }
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

    // Format the date as DD-MM-YYYY
    const formattedDate = new Date(formData.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).split('/').join('.');

    // Create filename with party name, vehicle number, and date
    const partyName = formData.partyName.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');
    const vehicleNumber = formData.vehicleNumber.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');
    const filename = `${partyName}_${vehicleNumber}_${formattedDate}.pdf`;

    const opt = {
      margin: 0.5,
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

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
        <div id="invoice-section" className="p-8 bg-white">
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
              <div className="flex justify-between">
                <span>
                  <strong>Bank Charges:</strong>
                </span>
                <span>-₹{bankCharges}</span>
              </div>

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
