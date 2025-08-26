import React, { useEffect, useRef, useState } from "react";
import { Calculator, FileText, Plus, RotateCcw, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import InvoiceModal from "./InvoiceModal";

const BillGenerator = ({ onLogout }) => {
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    partyName: "",
    date: "",
    vehicleNumber: "",
    billNumber: "",
    amount: "",
    bill: "",
    quanrev: "",
    dust: "",
    gst: "",
    tds2: "",
    tds01: "",
    be: "",
    dalla: "",
  });

  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [includeDhara, setIncludeDhara] = useState(true);
  const [includeBankCharges, setIncludeBankCharges] = useState(true);

  // Refs for keyboard navigation
  const inputRefs = useRef([]);
  const addInputRef = (el) => {
    if (el && !inputRefs.current.includes(el)) {
      inputRefs.current.push(el);
    }
  };

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem("billGenerator_formData");
    const savedItems = localStorage.getItem("billGenerator_items");
    const drafts = localStorage.getItem("billGenerator_drafts");

    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    if (drafts) {
      setSavedDrafts(JSON.parse(drafts));
    }

    // Focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem("billGenerator_formData", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem("billGenerator_items", JSON.stringify(items));
  }, [items]);

  // Calculations
  const totalQuantity =
    (parseFloat(formData.quanrev) || 0) - (parseFloat(formData.dust) || 0);
  const itemTotal = items.reduce((acc, item) => acc + item.total, 0);
  const OPFP = includeDhara ? (itemTotal * 0.015).toFixed(0) : 0;
  const bankCharges = includeBankCharges ? 67 : 0;
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

  // Form handlers
  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Define the exact navigation order based on field IDs
  const navigationOrder = [
    'partyName',    // 0
    'billNumber',   // 1
    'amount',       // 2
    'bill',         // 3 (basic price)
    'dust',         // 4
    'date',         // 5
    'vehicleNumber',// 6
    'gst',         // 7
    'tds2',        // 8 (TDS 2%)
    'tds01',       // 9 (TDS 0.1%)
    'be',          // 10 (Billing Excess)
    'dalla',       // 11
    'quantity',    // 12
    'price'        // 13
  ];

  // Function to get the next input field
  const getNextInput = (currentInput) => {
    const currentIndex = navigationOrder.indexOf(currentInput.id);
    if (currentIndex === -1) return null;
    
    const nextIndex = (currentIndex + 1) % navigationOrder.length;
    const nextId = navigationOrder[nextIndex];
    return inputRefs.current.find(ref => ref?.id === nextId);
  };

  // Function to get the previous input field
  const getPrevInput = (currentInput) => {
    const currentIndex = navigationOrder.indexOf(currentInput.id);
    if (currentIndex === -1) return null;
    
    const prevIndex = (currentIndex - 1 + navigationOrder.length) % navigationOrder.length;
    const prevId = navigationOrder[prevIndex];
    return inputRefs.current.find(ref => ref?.id === prevId);
  };

  // Keyboard navigation
  const handleKeyDown = (e, index) => {
    // Get the current input element
    const currentInput = inputRefs.current[index];
    if (!currentInput) return;

    // Handle Ctrl+Enter to generate invoice
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
      return;
    }

    // Handle Shift to add item
    if (e.key === "Shift") {
      e.preventDefault();
      handleAddItem();
      return;
    }

    // Navigation on Enter or ArrowDown
    if ((e.key === "Enter" || e.key === "ArrowDown") && !e.shiftKey) {
      e.preventDefault();
      const nextInput = getNextInput(currentInput);
      nextInput?.focus();
      return;
    }

    // Navigation on ArrowUp
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = getPrevInput(currentInput);
      prevInput?.focus();
      return;
    }

    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleSaveDraft();
    }
  };

  // Item management
  const handleAddItem = () => {
    if (
      !quantity ||
      !price ||
      isNaN(parseFloat(quantity)) ||
      isNaN(parseFloat(price))
    ) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid quantity and price",
        variant: "destructive",
        duration: 1000,
      });
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      total: parseFloat(quantity) * parseFloat(price),
    };

    setItems((prev) => [...prev, newItem]);
    setQuantity("");
    setPrice("");

    toast({
      title: "Item Added",
      description: `Added ${quantity} × ₹${price} = ₹${newItem.total.toFixed(2)}`,
      duration: 1000,
    });
  };

  const handleDeleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Item Removed",
      description: "Item has been removed from the bill",
      duration: 1000,
    });
  };

  // Generate invoice
  const handleGenerate = () => {
    if (
      !formData.partyName ||
      !formData.date ||
      !formData.vehicleNumber ||
      items.length === 0
    ) {
      toast({
        title: "Missing Information",
        description:
          "Please fill all required fields and add at least one item",
        variant: "destructive",
        duration: 1000,
      });
      return;
    }
    setShowInvoice(true);
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      partyName: "",
      date: "",
      vehicleNumber: "",
      bill: "",
      amount: "",
      quanrev: "",
      dust: "",
      gst: "",
      tds2: "",
      tds01: "",
      be: "",
      dalla: "",
    });
    setQuantity("");
    setPrice("");
    setItems([]);
    localStorage.removeItem("billGenerator_formData");
    localStorage.removeItem("billGenerator_items");

    toast({
      title: "Form Reset",
      description: "All fields have been cleared",
      duration: 1000,
    });
  };

  // // Save draft
  // const handleSaveDraft = () => {
  //   const draft = {
  //     id: Date.now().toString(),
  //     name: `${formData.partyName || "Draft"} - ${new Date().toLocaleDateString()}`,
  //     formData,
  //     items,
  //     createdAt: new Date().toISOString(),
  //   };

  //   const newDrafts = [...savedDrafts, draft];
  //   setSavedDrafts(newDrafts);
  //   localStorage.setItem("billGenerator_drafts", JSON.stringify(newDrafts));

  //   toast({
  //     title: "Draft Saved",
  //     description: "Your bill has been saved as a draft",
  //     duration: 1000,
  //   });
  // };

  // // Load draft
  // const handleLoadDraft = (draft) => {
  //   setFormData(draft.formData);
  //   setItems(draft.items);

  //   toast({
  //     title: "Draft Loaded",
  //     description: `Loaded draft: ${draft.name}`,
  //     duration: 1000,
  //   });
  // };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[2000px] mx-auto p-2 mx-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Bill Generator
            </h1>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleReset}
              variant="outline"
              size="default"
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 text-base px-6 py-2 h-auto"
            >
              <RotateCcw size={20} className="mr-2" />
              Reset
            </Button>

            <Button
              onClick={handleGenerate}
              size="default"
              className="bg-orange-500 hover:bg-orange-600 text-base px-6 py-2 h-auto"
            >
              <FileText size={20} className="mr-2" />
              Generate Bill
            </Button>
          </div>
        </div>

        {/* Main Content Grid - 3 large columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          {/* Left Column - Basic Information */}
          <Card className="bg-white border-slate-200 shadow-lg h-[630px] rounded-lg border border-slate-300">
            <CardHeader className="pb-4 bg-slate-800 border-b border-slate-700">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <FileText size={18} />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <Label
                  htmlFor="partyName"
                  className="text-slate-700 font-semibold text-sm"
                >
                  Party Name *
                </Label>
                <Input
                  id="partyName"
                  ref={addInputRef}
                  onKeyDown={(e) => handleKeyDown(e, 0)}
                  value={formData.partyName}
                  onChange={(e) => updateFormData("partyName", e.target.value)}
                  placeholder="Enter party name"
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="billNumber"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Bill Number
                  </Label>
                  <Input
                    id="billNumber"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 1)}
                    value={formData.billNumber}
                    onChange={(e) => updateFormData("billNumber", e.target.value)}
                    placeholder="Enter bill number"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="amount"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Bill Amount
                  </Label>
                  <Input
                    id="amount"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 2)}
                    value={formData.amount}
                    onChange={(e) => updateFormData("amount", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="bill"
                  className="text-slate-700 font-semibold text-sm"
                >
                  Basic Price
                </Label>
                <Input
                  id="bill"
                  ref={addInputRef}
                  onKeyDown={(e) => handleKeyDown(e, 3)}
                  value={formData.bill}
                  onChange={(e) => updateFormData("bill", e.target.value)}
                  placeholder="0.00"
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="quanrev"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Quantity Received
                  </Label>
                  <Input
                    id="quanrev"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 3)}
                    value={formData.quanrev}
                    onChange={(e) => updateFormData("quanrev", e.target.value)}
                    placeholder="0"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="dust"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Dust
                  </Label>
                  <Input
                    id="dust"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 4)}
                    value={formData.dust}
                    onChange={(e) => updateFormData("dust", e.target.value)}
                    placeholder="0"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

              {totalQuantity >= 0 && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-slate-700">
                    <strong className="text-slate-800">Final Weight:</strong>{" "}
                    {formData.quanrev ? formData.quanrev : 0} - {formData.dust ? formData.dust : 0} ={" "}
                    <span className="font-bold text-orange-600 text-base">
                      {totalQuantity}
                    </span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="date"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 6)}
                    value={formData.date}
                    onChange={(e) => updateFormData("date", e.target.value)}
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="vehicleNumber"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Vehicle Number *
                  </Label>
                  <Input
                    id="vehicleNumber"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 7)}
                    value={formData.vehicleNumber}
                    onChange={(e) =>
                      updateFormData("vehicleNumber", e.target.value)
                    }
                    placeholder="Enter vehicle number"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Middle Column - Financial Details */}
          <Card className="bg-white border-slate-200 shadow-lg h-[630px] rounded-lg border border-slate-300">
            <CardHeader className="pb-4 bg-slate-800 border-b border-slate-700">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Calculator size={18} />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="gst"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    GST
                  </Label>
                  <Input
                    id="gst"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 7)}
                    value={formData.gst}
                    onChange={(e) => updateFormData("gst", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="tds2"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    TDS (2%)
                  </Label>
                  <Input
                    id="tds2"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 8)}
                    value={formData.tds2}
                    onChange={(e) => updateFormData("tds2", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="tds01"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    TDS (0.1%)
                  </Label>
                  <Input
                    id="tds01"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 9)}
                    value={formData.tds01}
                    onChange={(e) => updateFormData("tds01", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="be"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Billing Excess
                  </Label>
                  <Input
                    id="be"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 12)}
                    value={formData.be}
                    onChange={(e) => updateFormData("be", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="dalla"
                  className="text-slate-700 font-semibold text-sm"
                >
                  Dalla
                </Label>
                <Input
                  id="dalla"
                  ref={addInputRef}
                  onKeyDown={(e) => handleKeyDown(e, 13)}
                  value={formData.dalla}
                  onChange={(e) => updateFormData("dalla", e.target.value)}
                  placeholder="0.00"
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-700 font-medium">Dhara (1.5%)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={includeDhara}
                        onChange={() => setIncludeDhara(!includeDhara)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <span className="text-blue-600 font-semibold text-base">
                    {includeDhara ? `-₹${OPFP}` : '₹0'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-700 font-medium">Bank Charges</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={includeBankCharges}
                        onChange={() => setIncludeBankCharges(!includeBankCharges)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <span className="text-blue-600 font-semibold text-base">
                    {includeBankCharges ? `-₹${bankCharges}` : '₹0'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Add Items */}
          <Card className="bg-white border-slate-200 shadow-lg h-[630px] flex flex-col rounded-lg border border-slate-300">
            <CardHeader className="pb-4 bg-slate-800 border-b border-slate-700">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Plus size={18} />
                Add Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col">
              {/* Fixed top section with inputs and button */}
              <div className="space-y-4 mb-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="quantity"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 10)}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="price"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Price
                  </Label>
                  <Input
                    id="price"
                    ref={addInputRef}
                    onKeyDown={(e) => handleKeyDown(e, 11)}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddItem}
                className="w-full bg-green-600 hover:bg-green-700 text-base h-10 mb-6"
                disabled={!quantity || !price}
              >
                <Plus size={18} className="mr-2" />
                Add Item (Shift)
              </Button>

              {/* Items List with fixed header and scrollable content */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Items Added
                  </h3>
                  {items.length > 0 && (
                    <span className="text-orange-600 font-semibold text-base">
                      Total: ₹{itemTotal.toFixed(2)}
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-300 rounded-lg">
                    <div className="text-slate-400 mb-3">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                        📋
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm">No items added yet</p>
                  </div>
                ) : (
                  <div className="h-[200px] overflow-y-auto bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <span className="text-slate-500 font-medium text-sm">
                                #{index + 1}
                              </span>
                              <div className="text-slate-800">
                                <span className="font-semibold text-base">
                                  {item.quantity}
                                </span>
                                <span className="text-slate-500 mx-2">×</span>
                                <span className="font-semibold text-base">
                                  ₹{item.price}
                                </span>
                                <span className="text-slate-500 mx-2">=</span>
                                <span className="font-bold text-orange-600 text-base">
                                  ₹{item.total.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(item.id)}
                            className="border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {items.length >= 0 && (
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white mb-8 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-orange-100 text-base mb-2">Items Total</p>
                  <p className="text-3xl font-bold">₹{itemTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-orange-100 text-base mb-2">
                    After Deductions
                  </p>
                  <p className="text-3xl font-bold">₹{grandTotal}</p>
                </div>
                {formData.amount && (
                  <div>
                    <p className="text-orange-100 text-base mb-2">Net Amount</p>
                    <p className="text-3xl font-bold">₹{formData.amount}</p>
                  </div>
                )}
                {formData.amount && (
                  <div>
                    <p className="text-orange-100 text-base mb-2">Balance</p>
                    <p
                      className={`text-3xl font-bold ${endTotal < 0 ? "text-red-200" : "text-green-200"}`}
                    >
                      ₹{endTotal.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Keyboard Shortcuts Help */}
        {/* Removed as requested */}

        {/* Invoice Modal */}
        {showInvoice && (
          <InvoiceModal
            formData={{ ...formData, includeDhara, includeBankCharges }}
            items={items}
            calculations={{
              itemTotal,
              OPFP,
              grandTotal,
              endTotal,
              totalQuantity,
              bankCharges,
            }}
            onClose={() => setShowInvoice(false)}
          />
        )}
      </div>
    </div>
  );
};

export default BillGenerator;
