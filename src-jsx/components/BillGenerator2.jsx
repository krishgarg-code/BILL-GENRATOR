import React, { useEffect, useRef, useState } from "react";
import { Calculator, FileText, Plus, RotateCcw, Trash2, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import InvoiceModal2 from "./InvoiceModal2";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BillGenerator2 = ({ onLogout }) => {
    const { toast } = useToast();
    const { setOpen } = useSidebar();

    const initialFormData = {
        partyName: "",
        billTo: "",
        date: "",
        vehicleNumber: "",
        billNumber: "",
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
    };

    // Form state
    const [billsPerPage, setBillsPerPage] = useState(1);
    const [currentBillIndex, setCurrentBillIndex] = useState(0);
    const [bills, setBills] = useState([
        { id: Date.now(), formData: { ...initialFormData }, items: [] }
    ]);

    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");
    const [showInvoice, setShowInvoice] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [savedDrafts, setSavedDrafts] = useState([]);
    const [includeDhara, setIncludeDhara] = useState(true);
    const [includeBankCharges, setIncludeBankCharges] = useState(true);

    const currentBill = bills[currentBillIndex] || bills[0];
    const formData = currentBill.formData;
    const items = currentBill.items;

    // Refs for keyboard navigation
    const inputRefs = useRef([]);
    const addInputRef = (el) => {
        if (el && !inputRefs.current.includes(el)) {
            inputRefs.current.push(el);
        }
    };

    // Load saved data on mount
    useEffect(() => {
        const savedBills = localStorage.getItem("billGenerator2_bills");
        const savedBillsPerPage = localStorage.getItem("billGenerator2_billsPerPage");

        if (savedBills) {
            setBills(JSON.parse(savedBills));
        } else {
            const savedData = localStorage.getItem("billGenerator2_formData");
            const savedItems = localStorage.getItem("billGenerator2_items");
            if (savedData || savedItems) {
                setBills([{
                    id: Date.now(),
                    formData: savedData ? JSON.parse(savedData) : { ...initialFormData },
                    items: savedItems ? JSON.parse(savedItems) : []
                }]);
            }
        }

        if (savedBillsPerPage) {
            setBillsPerPage(parseInt(savedBillsPerPage));
        }

        // Focus first input
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 100);
    }, []);

    // Auto-save to localStorage
    useEffect(() => {
        localStorage.setItem("billGenerator2_bills", JSON.stringify(bills));
        localStorage.setItem("billGenerator2_billsPerPage", billsPerPage.toString());
    }, [bills, billsPerPage]);

    // Calculations
    const totalQuantity =
        (parseFloat(formData.quanrev) || 0) - (parseFloat(formData.dust) || 0);
    const itemTotal = items.reduce((acc, item) => acc + item.total, 0);
    const OPFP = includeDhara ? (itemTotal * 0.01).toFixed(0) : 0;
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
        setBills(prev => {
            const newBills = [...prev];
            newBills[currentBillIndex] = {
                ...newBills[currentBillIndex],
                formData: {
                    ...newBills[currentBillIndex].formData,
                    [field]: value
                }
            };
            return newBills;
        });
    };

    // Bill Management Handlers
    const handleBillsPerPageChange = (count) => {
        setBillsPerPage(count);
    };

    const handleAddBill = () => {
        if (bills.length >= billsPerPage) {
            toast({
                title: "Limit Reached",
                description: `You can only have ${billsPerPage} bills per page.`,
                variant: "destructive",
                duration: 1000,
            });
            return;
        }
        setBills(prev => [
            ...prev,
            { id: Date.now(), formData: { ...initialFormData }, items: [] }
        ]);
        setCurrentBillIndex(bills.length); // Switch to new bill
    };

    const handleDeleteBill = (index) => {
        if (bills.length <= 1) return;

        const newBills = bills.filter((_, i) => i !== index);
        setBills(newBills);

        if (currentBillIndex >= newBills.length) {
            setCurrentBillIndex(newBills.length - 1);
        }
        toast({
            title: "Bill Deleted",
            description: "Bill has been removed.",
            duration: 1000,
        });
    };

    // Define the exact navigation order based on field IDs
    const navigationOrder = [
        'partyName',    // 0
        'billTo',       // 1
        'billNumber',   // 2
        'amount',       // 3
        'bill',         // 4 (basic price)
        'quanrev',      // 5 (quantity received)
        'dust',         // 6
        'date',         // 7
        'vehicleNumber',// 8
        'gst',         // 9
        'tds2',        // 10 (TDS 2%)
        'tds01',       // 11 (TDS 0.1%)
        'be',          // 12 (Billing Excess)
        'dalla',       // 13
        'quantity',    // 14
        'price'        // 15
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
    const handleKeyDown = (e) => {
        // Get the current input element
        const currentInput = e.currentTarget;
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

        setBills(prev => {
            const newBills = [...prev];
            newBills[currentBillIndex] = {
                ...newBills[currentBillIndex],
                items: [...newBills[currentBillIndex].items, newItem]
            };
            return newBills;
        });

        setQuantity("");
        setPrice("");

        toast({
            title: "Item Added",
            description: `Added ${quantity} × ₹${price} = ₹${newItem.total.toFixed(2)}`,
            duration: 1000,
        });

        // Reset focus to quantity input
        setTimeout(() => {
            const qtyInput = inputRefs.current.find(ref => ref?.id === 'quantity');
            qtyInput?.focus();
        }, 0);
    };

    const handleDeleteItem = (itemId) => {
        setBills(prev => {
            const newBills = [...prev];
            newBills[currentBillIndex] = {
                ...newBills[currentBillIndex],
                items: newBills[currentBillIndex].items.filter(item => item.id !== itemId)
            };
            return newBills;
        });

        toast({
            title: "Item Removed",
            description: "Item has been removed from the bill",
            duration: 1000,
        });
    };

    // Generate invoice
    const handleGenerate = () => {
        // Simplified validation: check if CURRENT bill has minimum info
        // We could loop through all bills, but let's just warn about the current one if it's being edited.
        // Actually, let's just check if there is ANY valid bill to print.
        const validBills = bills.filter(b => b.formData.partyName && b.items.length > 0);

        if (validBills.length === 0) {
            toast({
                title: "Missing Information",
                description:
                    `Please ensure at least one bill has Party Name and Items.`,
                variant: "destructive",
                duration: 1000,
            });
            return;
        }
        setShowInvoice(true);
    };

    // Reset form
    // Reset form
    const handleReset = () => {
        if (confirm("Reset ALL data? This will clear all bills.")) {
            // Reset to initial state: 1 bill, empty
            setBills([{ id: Date.now(), formData: { ...initialFormData }, items: [] }]);
            setCurrentBillIndex(0);
            setBillsPerPage(1);
            setQuantity("");
            setPrice("");
            localStorage.removeItem("billGenerator2_bills");
            localStorage.removeItem("billGenerator2_billsPerPage");

            toast({
                title: "Form Reset",
                description: "All fields have been cleared",
                duration: 1000,
            });
        }
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
    //   localStorage.setItem("billGenerator2_drafts", JSON.stringify(newDrafts));

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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300">
            <div className="w-full p-4">
                {/* Header */}
                <div className="flex flex-col gap-6 mb-8 mt-8 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div
                                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                onMouseEnter={() => setOpen(true)}
                            >
                                <SidebarTrigger className="h-6 w-6 text-zinc-700 dark:text-zinc-200" />
                            </div>
                            <div className="h-8 w-px bg-zinc-300 dark:bg-zinc-700"></div>
                            <div>
                                <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">INGOT BILL</h1>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage and generate ingot bills</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                size="default"
                                className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-base px-6 py-2 h-auto"
                            >
                                <RotateCcw size={20} className="mr-2" />
                                Reset
                            </Button>

                            <Button
                                onClick={handleGenerate}
                                size="default"
                                className="bg-[#00963C] hover:bg-[#007a30] text-base px-6 py-2 h-auto"
                            >
                                <FileText size={20} className="mr-2" />
                                Generate Bill
                            </Button>
                        </div>
                    </div>

                    {/* Multi-Bill Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label className="text-zinc-600 dark:text-zinc-400">Bills per Page:</Label>
                                <Select
                                    value={billsPerPage.toString()}
                                    onValueChange={(val) => handleBillsPerPageChange(parseInt(val))}
                                >
                                    <SelectTrigger className="w-[100px] h-9 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700">
                                        <SelectValue placeholder="1" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Bill</SelectItem>
                                        <SelectItem value="2">2 Bills</SelectItem>
                                        <SelectItem value="4">4 Bills</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Tabs value={currentBillIndex.toString()} onValueChange={(val) => setCurrentBillIndex(parseInt(val))} className="w-auto">
                                <TabsList className="bg-zinc-100 dark:bg-zinc-800">
                                    {bills.map((bill, index) => (
                                        <TabsTrigger
                                            key={bill.id}
                                            value={index.toString()}
                                            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700"
                                        >
                                            Bill {index + 1}
                                            {bills.length > 1 && (
                                                <span
                                                    className="ml-2 hover:text-red-500 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteBill(index);
                                                    }}
                                                >
                                                    <X size={14} />
                                                </span>
                                            )}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>

                            <Button
                                onClick={handleAddBill}
                                disabled={bills.length >= billsPerPage}
                                size="sm"
                                variant="secondary"
                                className="h-9"
                            >
                                <Plus size={16} className="mr-1" /> Add Bill
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid - 3 large columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                    {/* Left Column - Basic Information */}
                    <Card className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 shadow-lg h-[630px] rounded-lg">
                        <CardHeader className="pb-4 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700 dark:border-zinc-800">
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <FileText size={18} />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="space-y-3 flex-1">
                                    <Label
                                        htmlFor="partyName"
                                        className="text-zinc-700 dark:text-zinc-300 font-semibold text-sm"
                                    >
                                        Bill From *
                                    </Label>
                                    <Input
                                        id="partyName"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.partyName}
                                        onChange={(e) => updateFormData("partyName", e.target.value)}
                                        placeholder="Enter sender name"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                                <div className="space-y-3 flex-1">
                                    <Label
                                        htmlFor="billTo"
                                        className="text-zinc-700 dark:text-zinc-300 font-semibold text-sm"
                                    >
                                        Bill To
                                    </Label>
                                    <Input
                                        id="billTo"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.billTo || ""}
                                        onChange={(e) => updateFormData("billTo", e.target.value)}
                                        placeholder="Enter receiver name"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="billNumber"
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        Bill Number
                                    </Label>
                                    <Input
                                        id="billNumber"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.billNumber}
                                        onChange={(e) => updateFormData("billNumber", e.target.value)}
                                        placeholder="Enter bill number"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="amount"
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        Bill Amount
                                    </Label>
                                    <Input
                                        id="amount"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.amount}
                                        onChange={(e) => updateFormData("amount", e.target.value)}
                                        placeholder="0.00"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label
                                    htmlFor="bill"
                                    className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                >
                                    Basic Price
                                </Label>
                                <Input
                                    id="bill"
                                    ref={addInputRef}
                                    onKeyDown={handleKeyDown}
                                    value={formData.bill}
                                    onChange={(e) => updateFormData("bill", e.target.value)}
                                    placeholder="0.00"
                                    className="bg-white dark:bg-[#18181B] border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="quanrev"
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        Quantity Received
                                    </Label>
                                    <Input
                                        id="quanrev"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.quanrev}
                                        onChange={(e) => updateFormData("quanrev", e.target.value)}
                                        placeholder="0"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="dust"
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        Dust
                                    </Label>
                                    <Input
                                        id="dust"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.dust}
                                        onChange={(e) => updateFormData("dust", e.target.value)}
                                        placeholder="0"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                            </div>

                            {totalQuantity >= 0 && (
                                <div className="p-4 bg-[#00963C]/10 rounded-lg border border-[#00963C]/20">
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                        <strong className="text-zinc-800 dark:text-white">Final Weight:</strong>{" "}
                                        {formData.quanrev ? formData.quanrev : 0} - {formData.dust ? formData.dust : 0} ={" "}
                                        <span className="font-bold text-[#00963C] text-base">
                                            {totalQuantity}
                                        </span>
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="date"
                                        className="text-zinc-700 dark:text-zinc-300 font-semibold text-sm"
                                    >
                                        Date *
                                    </Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.date}
                                        onChange={(e) => updateFormData("date", e.target.value)}
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="vehicleNumber"
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        Vehicle Number *
                                    </Label>
                                    <Input
                                        id="vehicleNumber"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.vehicleNumber}
                                        onChange={(e) =>
                                            updateFormData("vehicleNumber", e.target.value)
                                        }
                                        placeholder="Enter vehicle number"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Middle Column - Financial Details */}
                    <Card className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 shadow-lg h-[630px] rounded-lg">
                        <CardHeader className="pb-4 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700 dark:border-zinc-800">
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
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        GST
                                    </Label>
                                    <Input
                                        id="gst"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.gst}
                                        onChange={(e) => updateFormData("gst", e.target.value)}
                                        placeholder="0.00"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="tds2"
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        Finance
                                    </Label>
                                    <Input
                                        id="tds2"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.tds2}
                                        onChange={(e) => updateFormData("tds2", e.target.value)}
                                        placeholder="0.00"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="tds01"
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        TDS (0.1%)
                                    </Label>
                                    <Input
                                        id="tds01"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.tds01}
                                        onChange={(e) => updateFormData("tds01", e.target.value)}
                                        placeholder="0.00"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="be"
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        Billing Excess
                                    </Label>
                                    <Input
                                        id="be"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={formData.be}
                                        onChange={(e) => updateFormData("be", e.target.value)}
                                        placeholder="0.00"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label
                                    htmlFor="dalla"
                                    className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                >
                                    Dalla/crane
                                </Label>
                                <Input
                                    id="dalla"
                                    ref={addInputRef}
                                    onKeyDown={handleKeyDown}
                                    value={formData.dalla}
                                    onChange={(e) => updateFormData("dalla", e.target.value)}
                                    placeholder="0.00"
                                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                />
                            </div>

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-zinc-700 dark:text-white font-medium">Dhara (1%)</span>
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

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-zinc-700 dark:text-white font-medium">Bank Charges</span>
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
                    <Card className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-lg h-[630px] flex flex-col rounded-lg border border-zinc-300 dark:border-zinc-700">
                        <CardHeader className="pb-4 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700 dark:border-zinc-800">
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
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        Quantity
                                    </Label>
                                    <Input
                                        id="quantity"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="Enter quantity"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="price"
                                        className="text-slate-700 dark:text-slate-300 font-semibold text-sm"
                                    >
                                        Price
                                    </Label>
                                    <Input
                                        id="price"
                                        ref={addInputRef}
                                        onKeyDown={handleKeyDown}
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="Enter price"
                                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#00963C] focus:ring-[#00963C]/20 text-sm h-10"
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
                                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                                        Items Added
                                    </h3>
                                    {items.length > 0 && (
                                        <span className="text-[#00963C] font-semibold text-base">
                                            Total: ₹{itemTotal.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {items.length === 0 ? (
                                    <div className="p-6 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
                                        <div className="text-zinc-400 dark:text-zinc-500 mb-3">
                                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl">
                                                📋
                                            </div>
                                        </div>
                                        <p className="text-zinc-500 text-sm">No items added yet</p>
                                    </div>
                                ) : (
                                    <div className="h-[200px] overflow-y-auto bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                                        <div className="space-y-3">
                                            {items.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-sm transition-shadow"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
                                                                #{index + 1}
                                                            </span>
                                                            <div className="text-zinc-800 dark:text-zinc-100">
                                                                <span className="font-semibold text-base">
                                                                    {item.quantity}
                                                                </span>
                                                                <span className="text-zinc-500 mx-2">×</span>
                                                                <span className="font-semibold text-base">
                                                                    ₹{item.price}
                                                                </span>
                                                                <span className="text-zinc-500 mx-2">=</span>
                                                                <span className="font-bold text-[#00963C] text-base">
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
                    <Card className="bg-gradient-to-r from-[#00963C] to-[#007a30] text-white mb-8 border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                <div>
                                    <p className="text-green-50 text-base mb-2">Items Total</p>
                                    <p className="text-3xl font-bold">₹{itemTotal.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-green-50 text-base mb-2">
                                        After Deductions
                                    </p>
                                    <p className="text-3xl font-bold">₹{grandTotal}</p>
                                </div>
                                {formData.amount && (
                                    <div>
                                        <p className="text-green-50 text-base mb-2">Net Amount</p>
                                        <p className="text-3xl font-bold">₹{formData.amount}</p>
                                    </div>
                                )}
                                {formData.amount && (
                                    <div>
                                        <p className="text-green-50 text-base mb-2">Balance</p>
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

                {/* Invoice Modal */}
                {showInvoice && (
                    <InvoiceModal2
                        bills={bills}
                        billsPerPage={billsPerPage}
                        globalSettings={{ includeDhara, includeBankCharges }}
                        onClose={() => setShowInvoice(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default BillGenerator2;
