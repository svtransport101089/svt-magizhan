import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MemoData, Invoice, InvoiceMemoSummary, Customer } from '../../types';
import {
    generateNewMemoNumber,
    saveMemoData,
    searchMemoByMemoNo,
    getCustomers,
    updateCustomerAddresses,
    getViewAllServicesData,
    generateNewInvoiceNumber,
    saveInvoice,
    getInvoiceById,
    getMemosByCustomerAndStatus,
} from '../../services/googleScriptMock';
import { useToast } from '../../hooks/useToast';
import { numberToWords } from '../../utils/numberToWords';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Card from '../ui/Card';
import ComboBox from '../ui/ComboBox';

const initialMemoState: MemoData = {
    trips_memo_no: '',
    trip_operated_date1: new Date().toISOString().split('T')[0],
    trip_upto_operated_date2: '',
    trips_vehicle_no: '',
    trips_vehicle_type: '',
    customers_name: '',
    customers_address1: '',
    customers_address2: '',
    trips_starting_time1: '',
    trips_closing_time1: '',
    trips_starting_time2: '',
    trips_closing_time2: '',
    trips_total_hours: '0',
    trips_startingKm1: '0',
    trips_closingKm1: '0',
    trips_startingKm2: '0',
    trips_closingKm2: '0',
    trips_totalKm: '0',
    products_item: '',
    trips_minimum_hours1: '0',
    trips_minimum_charges1: '0',
    products_item2: '',
    trips_minimum_hours2: '0',
    trips_minimum_charges2: '0',
    trips_extra_hours: '0',
    trips_for_additional_hour_rate: '0',
    trips_for_additional_hour_amt: '0',
    trips_fixed_amt_desc: 'Fixed Amount',
    trips_fixed_amt: '0',
    trips_km: '0',
    trips_km_rate: '0',
    trips_Km_amt: '0',
    trips_discount_percentage: '0',
    trips_discount: '0',
    trips_driver_bata_qty: '0',
    trips_driver_bata_rate: '0',
    trips_driver_bata_amt: '0',
    trips_toll_amt: '0',
    trips_permit_amt: '0',
    trips_night_hault_amt: '0',
    trips_other_charges_desc: 'Other Charges',
    trips_other_charges_amt: '0',
    trips_total_amt: '0',
    trips_less_advance: '0',
    trips_balance: '0',
    trips_total_amt_in_words: '',
    trips_remark: '',
    status: 'PENDING',
};

interface MemoFormProps {
    memoToLoad: string | null;
    onSaveSuccess: () => void;
    onCancel: () => void;
    printOnLoad?: boolean;
    onPrinted?: () => void;
}

const InvoiceInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`p-1 border border-gray-400 rounded-sm w-full text-sm font-bold read-only:bg-gray-200 disabled:bg-gray-200 ${props.className}`} />
);
const InvoiceTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`p-1 border border-gray-400 rounded-sm w-full text-sm font-bold read-only:bg-gray-200 ${props.className}`} />
);

const InvoiceComboBox = ({ options, value, onChange, placeholder }: { options: { value: string; label: string }[], value: string, onChange: (value: string) => void, placeholder?: string }) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const filteredOptions = useMemo(() => {
        if (!inputValue) return options;
        const selectedOption = options.find(o => o.value === value);
        if (selectedOption && selectedOption.label.toLowerCase() === inputValue.toLowerCase()) {
            return options;
        }
        return options.filter(option =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
        );
    }, [inputValue, options, value]);

    useEffect(() => {
        const selectedOption = options.find(option => option.value === value);
        setInputValue(selectedOption ? selectedOption.label : '');
    }, [value, options]);
    
    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredOptions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                const selectedOption = options.find(option => option.value === value);
                setInputValue(selectedOption ? selectedOption.label : '');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef, value, options]);

    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && listRef.current) {
            const el = listRef.current.children[highlightedIndex] as HTMLLIElement;
            if (el) {
                el.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [isOpen, highlightedIndex]);

    const handleSelectOption = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelectOption(filteredOptions[highlightedIndex].value);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                const selectedOption = options.find(option => option.value === value);
                setInputValue(selectedOption ? selectedOption.label : '');
                setHighlightedIndex(-1);
                break;
            case 'Tab':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };
    
    return (
        <div className="relative w-full" ref={wrapperRef} role="combobox" aria-haspopup="listbox" aria-expanded={isOpen}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="p-1 border border-gray-400 rounded-sm w-full text-sm font-bold bg-white"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls="combobox-options"
                    aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
                />
                <div className={`absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            {isOpen && (
                <ul
                    ref={listRef}
                    id="combobox-options"
                    role="listbox"
                    className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg"
                >
                    {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
                        <li
                            key={option.value}
                            id={`option-${index}`}
                            role="option"
                            aria-selected={highlightedIndex === index}
                            onClick={() => handleSelectOption(option.value)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`px-2 py-1 cursor-pointer text-sm ${highlightedIndex === index ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'}`}
                        >
                            {option.label}
                        </li>
                    )) : <li className="px-2 py-1 text-gray-500 text-sm">No options found</li>}
                </ul>
            )}
        </div>
    );
};


export const MemoForm: React.FC<MemoFormProps> = ({ memoToLoad, onSaveSuccess, onCancel, printOnLoad = false, onPrinted = () => {} }) => {
    const [memoData, setMemoData] = useState<MemoData>(initialMemoState);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [customerNames, setCustomerNames] = useState<string[]>([]);
    const [services, setServices] = useState<string[][]>([]);
    const { addToast } = useToast();

    const serviceOptions = useMemo(() => {
        return services.map(service => ({
            value: service[3],
            label: `${service[0]} (${service[1]}) - ${service[2]}`
        }));
    }, [services]);

    const customerOptions = useMemo(() => {
        return customerNames.map(name => ({
            value: name,
            label: name,
        }));
    }, [customerNames]);

    const calculateTotals = useCallback(() => {
        setMemoData(prev => {
            const p = (v: string | number) => parseFloat(String(v)) || 0;

            const calculateHours = (start: string, end: string) => {
                if (!start || !end) return 0;
                const [startH, startM] = start.split(':').map(Number);
                const [endH, endM] = end.split(':').map(Number);
                if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
                let startMinutes = startH * 60 + startM;
                let endMinutes = endH * 60 + endM;
                if (endMinutes < startMinutes) endMinutes += 24 * 60;
                return (endMinutes - startMinutes) / 60;
            };

            const hours1 = calculateHours(prev.trips_starting_time1, prev.trips_closing_time1);
            const hours2 = calculateHours(prev.trips_starting_time2, prev.trips_closing_time2);
            const totalHours = parseFloat((hours1 + hours2).toFixed(2));
            const driverBataQty = Math.ceil(totalHours);

            const totalKm = (p(prev.trips_closingKm1) - p(prev.trips_startingKm1)) + (p(prev.trips_closingKm2) - p(prev.trips_startingKm2));

            const extraHours = Math.max(0, totalHours - p(prev.trips_minimum_hours1) - p(prev.trips_minimum_hours2));
            const extraHourAmt = extraHours * p(prev.trips_for_additional_hour_rate);

            const kmAmt = totalKm * p(prev.trips_km_rate);
            const driverBataAmt = driverBataQty * p(prev.trips_driver_bata_rate);

            const subTotal = p(prev.trips_minimum_charges1) + p(prev.trips_minimum_charges2) + extraHourAmt + kmAmt + driverBataAmt +
                p(prev.trips_fixed_amt) + p(prev.trips_toll_amt) + p(prev.trips_permit_amt) + p(prev.trips_night_hault_amt) + p(prev.trips_other_charges_amt);
            
            const discountableAmount = p(prev.trips_minimum_charges1) + p(prev.trips_minimum_charges2) + extraHourAmt + p(prev.trips_fixed_amt) + kmAmt;
            const discountAmt = discountableAmount * (p(prev.trips_discount_percentage) / 100);
            
            const totalAmt = subTotal - discountAmt;
            const balance = totalAmt - p(prev.trips_less_advance);

            return {
                ...prev,
                trips_total_hours: String(totalHours),
                trips_driver_bata_qty: String(driverBataQty),
                trips_totalKm: String(totalKm),
                trips_km: String(totalKm),
                trips_extra_hours: String(extraHours.toFixed(2)),
                trips_for_additional_hour_amt: String(extraHourAmt.toFixed(0)),
                trips_Km_amt: String(kmAmt.toFixed(2)),
                trips_driver_bata_amt: String(driverBataAmt.toFixed(2)),
                trips_discount: String(discountAmt.toFixed(2)),
                trips_total_amt: String(totalAmt.toFixed(2)),
                trips_balance: String(balance.toFixed(2)),
                trips_total_amt_in_words: numberToWords(Math.round(totalAmt)),
            };
        });
    }, []);

    useEffect(() => {
        calculateTotals();
    }, [
        calculateTotals, memoData.trips_starting_time1, memoData.trips_closing_time1,
        memoData.trips_starting_time2, memoData.trips_closing_time2, memoData.trips_startingKm1,
        memoData.trips_closingKm1, memoData.trips_startingKm2, memoData.trips_closingKm2,
        memoData.trips_minimum_hours1, memoData.trips_minimum_hours2, memoData.trips_minimum_charges1, 
        memoData.trips_minimum_charges2, memoData.trips_for_additional_hour_rate, memoData.trips_km_rate,
        memoData.trips_driver_bata_rate, memoData.trips_fixed_amt,
        memoData.trips_toll_amt, memoData.trips_permit_amt, memoData.trips_night_hault_amt,
        memoData.trips_other_charges_amt, memoData.trips_discount_percentage, memoData.trips_less_advance,
    ]);


    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const customerData = await getCustomers();
                setCustomerNames(customerData.map(c => c.customers_name));

                const servicesData = await getViewAllServicesData();
                setServices(servicesData);

                if (memoToLoad) {
                    const data = await searchMemoByMemoNo(memoToLoad);
                    if (data) {
                        setMemoData(data);
                    } else {
                        addToast(`Memo ${memoToLoad} not found.`, 'error');
                        onCancel();
                    }
                } else {
                    const memoNo = await generateNewMemoNumber();
                    setMemoData(prev => ({ ...initialMemoState, trips_memo_no: memoNo, trip_operated_date1: new Date().toISOString().split('T')[0] }));
                }
            } catch (error) {
                addToast('Failed to load initial data.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [memoToLoad, addToast, onCancel]);

    useEffect(() => {
        if (!isLoading && printOnLoad) {
            const handleAfterPrint = () => {
                window.removeEventListener('afterprint', handleAfterPrint);
                setTimeout(() => {
                    onPrinted();
                }, 100);
            };
            
            window.addEventListener('afterprint', handleAfterPrint);
            const printTimer = setTimeout(() => {
                window.print();
            }, 300);
            return () => {
                clearTimeout(printTimer);
                window.removeEventListener('afterprint', handleAfterPrint);
            };
        }
    }, [isLoading, printOnLoad, onPrinted]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setMemoData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomerNameChange = async (name: string) => {
        setMemoData(prev => ({ ...prev, customers_name: name }));
        try {
            const addresses = await updateCustomerAddresses(name);
            if (addresses.length > 0) {
                 setMemoData(prev => ({
                    ...prev,
                    customers_address1: addresses[0].address1,
                    customers_address2: addresses[0].address2,
                }));
            } else {
                 setMemoData(prev => ({
                    ...prev,
                    customers_address1: '',
                    customers_address2: '',
                }));
            }
        } catch (error) {
           console.error("Failed to fetch customer addresses", error);
        }
    };
    
    const handleServiceChange = (productItem: string) => {
        const selectedService = services.find(service => service[3] === productItem);

        if (selectedService) {
            const [ , , vehicleType, , minHours, , minCharges, addHourCharge, , driverBata ] = selectedService;
            setMemoData(prev => ({
                ...prev,
                products_item: productItem,
                trips_vehicle_type: vehicleType,
                trips_minimum_hours1: minHours,
                trips_minimum_charges1: minCharges,
                trips_for_additional_hour_rate: addHourCharge,
                trips_driver_bata_rate: driverBata || '0',
            }));
        } else {
             setMemoData(prev => ({
                ...prev,
                products_item: '',
                trips_vehicle_type: '',
                trips_minimum_hours1: '0',
                trips_minimum_charges1: '0',
                trips_for_additional_hour_rate: '0',
                trips_driver_bata_rate: '0',
            }));
        }
    };

    const handleServiceChange2 = (productItem: string) => {
        const selectedService = services.find(service => service[3] === productItem);

        if (selectedService) {
            const [ , , , , minHours, , minCharges ] = selectedService;

            setMemoData(prev => ({
                ...prev,
                products_item2: productItem,
                trips_minimum_hours2: minHours,
                trips_minimum_charges2: minCharges,
            }));
        } else {
             setMemoData(prev => ({
                ...prev,
                products_item2: '',
                trips_minimum_hours2: '0',
                trips_minimum_charges2: '0',
            }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await saveMemoData(memoData);
            if (response.startsWith('SUCCESS')) {
                addToast('Memo saved successfully!', 'success');
                onSaveSuccess();
            } else {
                throw new Error(response);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addToast(`Failed to save memo: ${errorMessage}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <form>
            <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-300">
                {/* Header */}
                <div className="flex justify-between items-center border border-gray-400 p-2">
                    <div className="flex items-center">
                        <img src="https://yo.fan/cdn/media-store%2Fpublic%2FOQcIlej0eQWI7C5URGLGQyDjTUk2%2F26033ce2-5d15-421c-bb76-ad85eb7ac7ff%2F794-450.jpg" alt="Logo" className="h-16 mr-4"/>
                        <div>
                            <h1 className="text-xl font-bold text-blue-700">SREE VENKATESWARA TRANSPORT</h1>
                            <p className="text-xs font-bold">NO:3/96, Kumaran Kudil Annex 3rd Street, Thuraipakkam, Chennai-97</p>
                            <p className="text-xs font-bold">Phone: 87789-92624, 97907-24160 | Email: svtransport.75@gmail.com</p>
                        </div>
                    </div>
                    <div className="w-1/4 space-y-1">
                        <div className="flex items-center">
                            <label className="text-xs font-bold w-28">Memo No:</label>
                            <InvoiceInput name="trips_memo_no" value={memoData.trips_memo_no} readOnly />
                        </div>
                        <div className="flex items-center">
                            <label className="text-xs font-bold w-28">Date:</label>
                            <InvoiceInput name="trip_operated_date1" type="date" value={memoData.trip_operated_date1} onChange={handleChange} />
                        </div>
                         <div className="flex items-center">
                            <label className="text-xs font-bold w-28">Vehicle No:</label>
                            <InvoiceInput name="trips_vehicle_no" value={memoData.trips_vehicle_no} onChange={handleChange} />
                        </div>
                        <div className="flex items-center">
                            <label className="text-xs font-bold w-28">Vehicle Type:</label>
                            <InvoiceInput name="trips_vehicle_type" value={memoData.trips_vehicle_type} readOnly />
                        </div>
                    </div>
                </div>

                {/* Customer, Time, KM */}
                <div className="grid grid-cols-12 gap-px border border-gray-400 border-t-0">
                    <div className="col-span-6 border-r border-gray-400 p-2 space-y-1">
                         <div className="flex items-center">
                            <label className="text-xs font-bold w-32">Customer Name:</label>
                            <InvoiceComboBox
                                options={customerOptions}
                                value={memoData.customers_name}
                                onChange={handleCustomerNameChange}
                                placeholder="Select or type customer name..."
                            />
                        </div>
                         <div className="flex items-center">
                            <label className="text-xs font-bold w-32">Address 1:</label>
                            <InvoiceInput name="customers_address1" value={memoData.customers_address1} onChange={handleChange} readOnly />
                        </div>
                         <div className="flex items-center">
                            <label className="text-xs font-bold w-32">Address 2:</label>
                            <InvoiceInput name="customers_address2" value={memoData.customers_address2} onChange={handleChange} readOnly />
                        </div>
                    </div>
                    <div className="col-span-3 border-r border-gray-400 p-2 space-y-1">
                        <div className="flex items-center"><label className="text-xs font-bold w-24">Start Time 1:</label><InvoiceInput type="time" name="trips_starting_time1" value={memoData.trips_starting_time1} onChange={handleChange}/></div>
                        <div className="flex items-center"><label className="text-xs font-bold w-24">Closing Time 1:</label><InvoiceInput type="time" name="trips_closing_time1" value={memoData.trips_closing_time1} onChange={handleChange}/></div>
                        <div className="flex items-center"><label className="text-xs font-bold w-24">Start Time 2:</label><InvoiceInput type="time" name="trips_starting_time2" value={memoData.trips_starting_time2} onChange={handleChange}/></div>
                        <div className="flex items-center"><label className="text-xs font-bold w-24">Closing Time 2:</label><InvoiceInput type="time" name="trips_closing_time2" value={memoData.trips_closing_time2} onChange={handleChange}/></div>
                        <div className="flex items-center"><label className="text-xs font-bold w-24">Total Hours:</label><InvoiceInput name="trips_total_hours" value={memoData.trips_total_hours} readOnly/></div>
                    </div>
                    <div className="col-span-3 p-2 space-y-1">
                        <div className="flex items-center"><label className="text-xs font-bold w-24">Start KM 1:</label><InvoiceInput type="number" name="trips_startingKm1" value={memoData.trips_startingKm1} onChange={handleChange}/></div>
                        <div className="flex items-center"><label className="text-xs font-bold w-24">Closing KM 1:</label><InvoiceInput type="number" name="trips_closingKm1" value={memoData.trips_closingKm1} onChange={handleChange}/></div>
                        <div className="flex items-center"><label className="text-xs font-bold w-24">Start KM 2:</label><InvoiceInput type="number" name="trips_startingKm2" value={memoData.trips_startingKm2} onChange={handleChange}/></div>
                        <div className="flex items-center"><label className="text-xs font-bold w-24">Closing KM 2:</label><InvoiceInput type="number" name="trips_closingKm2" value={memoData.trips_closingKm2} onChange={handleChange}/></div>
                        <div className="flex items-center"><label className="text-xs font-bold w-24">Total KM:</label><InvoiceInput name="trips_totalKm" value={memoData.trips_totalKm} readOnly/></div>
                    </div>
                </div>

                {/* Particulars Table */}
                <div className="border border-gray-400 border-t-0">
                    <div className="grid grid-cols-12 bg-green-200 font-bold text-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400">Particulars</div>
                        <div className="col-span-1 p-1 border-r border-gray-400">Qty</div>
                        <div className="col-span-2 p-1 border-r border-gray-400">Rate</div>
                        <div className="col-span-3 p-1">Amount</div>
                    </div>
                     <div className="grid grid-cols-12 items-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400">
                           <InvoiceComboBox
                                options={serviceOptions}
                                value={memoData.products_item}
                                onChange={handleServiceChange}
                                placeholder="Select or type to search service..."
                            />
                        </div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput name="trips_minimum_hours1" value={memoData.trips_minimum_hours1} readOnly/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_minimum_charges1" type="number" value={memoData.trips_minimum_charges1} onChange={handleChange}/></div>
                    </div>
                     <div className="grid grid-cols-12 items-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400">
                           <InvoiceComboBox
                                options={serviceOptions}
                                value={memoData.products_item2}
                                onChange={handleServiceChange2}
                                placeholder="Select or type to search service..."
                            />
                        </div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput name="trips_minimum_hours2" value={memoData.trips_minimum_hours2} readOnly/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_minimum_charges2" type="number" value={memoData.trips_minimum_charges2} onChange={handleChange}/></div>
                    </div>
                     <div className="grid grid-cols-12 items-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400"><InvoiceInput value="Extra Hours" readOnly/></div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput name="trips_extra_hours" value={memoData.trips_extra_hours} readOnly/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput name="trips_for_additional_hour_rate" type="number" value={memoData.trips_for_additional_hour_rate} onChange={handleChange}/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_for_additional_hour_amt" value={memoData.trips_for_additional_hour_amt} readOnly/></div>
                    </div>
                     <div className="grid grid-cols-12 items-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400"><InvoiceInput name="trips_fixed_amt_desc" value={memoData.trips_fixed_amt_desc} onChange={handleChange}/></div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_fixed_amt" type="number" value={memoData.trips_fixed_amt} onChange={handleChange}/></div>
                    </div>
                     <div className="grid grid-cols-12 items-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400"><InvoiceInput value="Total KM Operated" readOnly/></div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput name="trips_km" value={memoData.trips_km} readOnly/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput name="trips_km_rate" type="number" value={memoData.trips_km_rate} onChange={handleChange}/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_Km_amt" value={memoData.trips_Km_amt} readOnly/></div>
                    </div>
                     <div className="grid grid-cols-12 items-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400"><InvoiceInput value="Discount (%)" readOnly/></div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput name="trips_discount_percentage" type="number" value={memoData.trips_discount_percentage} onChange={handleChange}/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_discount" value={memoData.trips_discount} readOnly/></div>
                    </div>
                     <div className="grid grid-cols-12 items-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400"><InvoiceInput value="Driver Bata" readOnly/></div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput name="trips_driver_bata_qty" type="number" value={memoData.trips_driver_bata_qty} readOnly/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput name="trips_driver_bata_rate" type="number" value={memoData.trips_driver_bata_rate} onChange={handleChange}/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_driver_bata_amt" value={memoData.trips_driver_bata_amt} readOnly/></div>
                    </div>
                     <div className="grid grid-cols-12 items-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400"><InvoiceInput value="Toll Charges" readOnly/></div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_toll_amt" type="number" value={memoData.trips_toll_amt} onChange={handleChange}/></div>
                    </div>
                     <div className="grid grid-cols-12 items-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400"><InvoiceInput value="Permit" readOnly/></div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_permit_amt" type="number" value={memoData.trips_permit_amt} onChange={handleChange}/></div>
                    </div>
                     <div className="grid grid-cols-12 items-center border-b border-gray-400">
                        <div className="col-span-6 p-1 border-r border-gray-400"><InvoiceInput value="Night Hault" readOnly/></div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_night_hault_amt" type="number" value={memoData.trips_night_hault_amt} onChange={handleChange}/></div>
                    </div>
                    <div className="grid grid-cols-12 items-center">
                        <div className="col-span-6 p-1 border-r border-gray-400"><InvoiceInput name="trips_other_charges_desc" value={memoData.trips_other_charges_desc} onChange={handleChange}/></div>
                        <div className="col-span-1 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-2 p-1 border-r border-gray-400"><InvoiceInput disabled/></div>
                        <div className="col-span-3 p-1"><InvoiceInput name="trips_other_charges_amt" type="number" value={memoData.trips_other_charges_amt} onChange={handleChange}/></div>
                    </div>
                </div>

                {/* Footer section */}
                <div className="grid grid-cols-12 border border-t-0 border-gray-400">
                    <div className="col-span-8 p-2 border-r border-gray-400 space-y-1">
                        <InvoiceTextarea name="trips_total_amt_in_words" value={memoData.trips_total_amt_in_words} readOnly rows={3} />
                        <div>
                           <label className="text-xs font-bold">Remark:</label>
                           <InvoiceTextarea name="trips_remark" value={memoData.trips_remark} onChange={handleChange} rows={2} />
                        </div>
                    </div>
                    <div className="col-span-2 text-right font-bold space-y-2 p-2 border-r border-gray-400">
                        <p>Total Amount:</p>
                        <p>Less Advance:</p>
                        <p>Balance:</p>
                    </div>
                    <div className="col-span-2 space-y-1 p-1">
                        <InvoiceInput name="trips_total_amt" value={memoData.trips_total_amt} readOnly />
                        <InvoiceInput name="trips_less_advance" type="number" value={memoData.trips_less_advance} onChange={handleChange} />
                        <InvoiceInput name="trips_balance" value={memoData.trips_balance} readOnly />
                    </div>
                </div>
                 <div className="grid grid-cols-12 border border-t-0 border-gray-400">
                    <div className="col-span-8 p-2 border-r border-gray-400">
                         <h5 className="font-bold text-sm">BANK DETAILS:</h5>
                        <p className="text-xs"><strong>Bank Name:</strong> KARUR VYSHYA BANK</p>
                        <p className="text-xs"><strong>Branch:</strong> WHITES ROAD</p>
                        <p className="text-xs"><strong>A/C No:</strong> 1219115000010252</p>
                        <p className="text-xs"><strong>IFSC:</strong> KVBL0001219</p>
                    </div>
                    <div className="col-span-4 p-2 text-center self-end">
                        <p className="font-bold">SREE VENKATESWARA TRANSPORT</p>
                        <p className="text-sm mt-8 border-t border-gray-500 pt-1">Authorized Signatory</p>
                    </div>
                 </div>

            </div>
             <div className="flex justify-end space-x-4 mt-6 print-hide">
                <Button type="button" onClick={() => window.print()} className="bg-green-600 hover:bg-green-700">Print</Button>
                <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancel</Button>
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Spinner /> : 'Save Memo'}
                </Button>
            </div>
        </form>
    );
};

// --- NEW INVOICE FORM COMPONENT ---

interface InvoiceFormProps {
    memoNosToLoad: string[];
    invoiceIdToLoad: number | null;
    onSaveSuccess: () => void;
    onCancel: () => void;
    printOnLoad?: boolean;
    onPrinted?: () => void;
}

const initialInvoiceState: Omit<Invoice, 'id'|'invoice_no'> & { invoice_no: string } = {
    invoice_no: '',
    invoice_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_address1: '',
    customer_address2: '',
    memos: [],
    total_amount: '0',
    less_advance: '0',
    balance: '0',
    total_amt_in_words: '',
    remark: '',
};

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ memoNosToLoad, invoiceIdToLoad, onSaveSuccess, onCancel, printOnLoad = false, onPrinted = () => {} }) => {
    const [invoiceData, setInvoiceData] = useState<Invoice | typeof initialInvoiceState>(initialInvoiceState);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    const calculateTotals = useCallback(() => {
        setInvoiceData(prev => {
            const p = (v: string | number) => parseFloat(String(v)) || 0;
            const totalAmount = prev.memos.reduce((sum, memo) => sum + p(memo.trips_total_amt), 0);
            const balance = totalAmount - p(prev.less_advance);
            
            return {
                ...prev,
                total_amount: totalAmount.toFixed(2),
                balance: balance.toFixed(2),
                total_amt_in_words: numberToWords(Math.round(totalAmount)),
            };
        });
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (invoiceIdToLoad) {
                    const invoice = await getInvoiceById(invoiceIdToLoad);
                     if (invoice) {
                        setInvoiceData(invoice);
                    } else {
                        addToast(`Invoice with ID ${invoiceIdToLoad} not found.`, 'error');
                        onCancel();
                    }
                } else if (memoNosToLoad.length > 0) {
                    const memos = (await Promise.all(memoNosToLoad.map(no => searchMemoByMemoNo(no))))
                                    .filter((m): m is MemoData => m !== null);
                    
                    if (memos.length === 0) {
                        addToast("Could not find memo details.", "error");
                        onCancel();
                        return;
                    }

                    const firstMemo = memos[0];
                    const newInvoiceNo = await generateNewInvoiceNumber();
                    const memoSummaries: InvoiceMemoSummary[] = memos.map(m => ({
                        trips_memo_no: m.trips_memo_no,
                        trip_operated_date1: m.trip_operated_date1,
                        trips_vehicle_no: m.trips_vehicle_no,
                        trips_total_amt: m.trips_total_amt,
                    }));

                    setInvoiceData({
                        ...initialInvoiceState,
                        invoice_no: newInvoiceNo,
                        customer_name: firstMemo.customers_name,
                        customer_address1: firstMemo.customers_address1,
                        customer_address2: firstMemo.customers_address2,
                        memos: memoSummaries,
                    });
                } else {
                    onCancel(); // No data to load
                }
            } catch (error) {
                 addToast("Failed to load memo data for invoice.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [memoNosToLoad, invoiceIdToLoad, addToast, onCancel]);

    useEffect(() => {
        if (!isLoading && printOnLoad) {
            const handleAfterPrint = () => {
                window.removeEventListener('afterprint', handleAfterPrint);
                setTimeout(() => {
                    onPrinted();
                }, 100);
            };
            
            window.addEventListener('afterprint', handleAfterPrint);
            const printTimer = setTimeout(() => {
                window.print();
            }, 300);
            return () => {
                clearTimeout(printTimer);
                window.removeEventListener('afterprint', handleAfterPrint);
            };
        }
    }, [isLoading, printOnLoad, onPrinted]);

    useEffect(() => {
        calculateTotals();
    }, [invoiceData.memos, invoiceData.less_advance, calculateTotals]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { id, ...dataToSave } = invoiceData as Invoice;
            const memoNosToUpdate = invoiceData.memos.map(m => m.trips_memo_no);
            await saveInvoice(dataToSave, memoNosToUpdate);
            addToast('Invoice saved successfully!', 'success');
            onSaveSuccess();
        } catch (error) {
             addToast('Failed to save invoice.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <form>
            <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-300">
                 {/* Header */}
                <div className="flex justify-between items-center border border-gray-400 p-2">
                    <div className="flex items-center">
                        <img src="https://yo.fan/cdn/media-store%2Fpublic%2FOQcIlej0eQWI7C5URGLGQyDjTUk2%2F26033ce2-5d15-421c-bb76-ad85eb7ac7ff%2F794-450.jpg" alt="Logo" className="h-16 mr-4"/>
                        <div>
                            <h1 className="text-xl font-bold text-blue-700">SREE VENKATESWARA TRANSPORT</h1>
                            <p className="text-xs font-bold">NO:3/96, Kumaran Kudil Annex 3rd Street, Thuraipakkam, Chennai-97</p>
                        </div>
                    </div>
                     <div className="w-1/4 space-y-1">
                        <h2 className="text-2xl font-bold text-center">INVOICE</h2>
                        <div className="flex items-center">
                            <label className="text-xs font-bold w-28">Invoice No:</label>
                            <InvoiceInput name="invoice_no" value={invoiceData.invoice_no} readOnly />
                        </div>
                        <div className="flex items-center">
                            <label className="text-xs font-bold w-28">Date:</label>
                            <InvoiceInput name="invoice_date" type="date" value={invoiceData.invoice_date} onChange={handleChange} />
                        </div>
                    </div>
                </div>
                {/* Customer Details */}
                <div className="border border-gray-400 border-t-0 p-2">
                    <p className="font-bold">To:</p>
                    <p className="font-bold text-lg ml-4">{invoiceData.customer_name}</p>
                    <p className="ml-4">{invoiceData.customer_address1}</p>
                    <p className="ml-4">{invoiceData.customer_address2}</p>
                </div>
                {/* Memos Table */}
                <div className="border border-gray-400 border-t-0">
                     <table className="min-w-full text-sm">
                        <thead className="bg-green-200 font-bold text-center">
                            <tr>
                                <th className="p-1 border-b border-r border-gray-400">S.No</th>
                                <th className="p-1 border-b border-r border-gray-400">Memo No</th>
                                <th className="p-1 border-b border-r border-gray-400">Date</th>
                                <th className="p-1 border-b border-r border-gray-400">Vehicle No</th>
                                <th className="p-1 border-b border-gray-400">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceData.memos.map((memo, index) => (
                                <tr key={memo.trips_memo_no}>
                                    <td className="p-1 border-r border-gray-400 text-center">{index + 1}</td>
                                    <td className="p-1 border-r border-gray-400">{memo.trips_memo_no}</td>
                                    <td className="p-1 border-r border-gray-400">{memo.trip_operated_date1}</td>
                                    <td className="p-1 border-r border-gray-400">{memo.trips_vehicle_no}</td>
                                    <td className="p-1 text-right">{parseFloat(memo.trips_total_amt).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </div>
                {/* Footer section */}
                <div className="grid grid-cols-12 border border-t-0 border-gray-400">
                    <div className="col-span-8 p-2 border-r border-gray-400 space-y-1">
                        <InvoiceTextarea name="total_amt_in_words" value={invoiceData.total_amt_in_words} readOnly rows={3} />
                        <div>
                           <label className="text-xs font-bold">Remark:</label>
                           <InvoiceTextarea name="remark" value={invoiceData.remark} onChange={handleChange} rows={2} />
                        </div>
                    </div>
                    <div className="col-span-2 text-right font-bold space-y-2 p-2 border-r border-gray-400">
                        <p>Total Amount:</p>
                        <p>Less Advance:</p>
                        <p>Balance:</p>
                    </div>
                    <div className="col-span-2 space-y-1 p-1">
                        <InvoiceInput name="total_amount" value={invoiceData.total_amount} readOnly />
                        <InvoiceInput name="less_advance" type="number" value={invoiceData.less_advance} onChange={handleChange} />
                        <InvoiceInput name="balance" value={invoiceData.balance} readOnly />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6 print-hide">
                <Button type="button" onClick={() => window.print()} className="bg-green-600 hover:bg-green-700">Print</Button>
                <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancel</Button>
                {!invoiceIdToLoad && (
                    <Button type="button" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Spinner /> : 'Save Invoice'}
                    </Button>
                )}
            </div>
        </form>
    );
};


// --- NEW CREATE INVOICE PAGE COMPONENT ---

interface CreateInvoicePageProps {
    onSaveSuccess: () => void;
}

export const CreateInvoicePage: React.FC<CreateInvoicePageProps> = ({ onSaveSuccess }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [pendingMemos, setPendingMemos] = useState<MemoData[]>([]);
    const [selectedMemoNos, setSelectedMemoNos] = useState<string[]>([]);
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            try {
                const customerData = await getCustomers();
                setCustomers(customerData);
            } catch {
                addToast("Failed to load customers.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, [addToast]);
    
    useEffect(() => {
        if (!selectedCustomer) {
            setPendingMemos([]);
            setSelectedMemoNos([]);
            return;
        }

        const fetchPendingMemos = async () => {
            setIsLoading(true);
            try {
                const memos = await getMemosByCustomerAndStatus(selectedCustomer);
                setPendingMemos(memos);
                setSelectedMemoNos([]);
            } catch {
                 addToast("Failed to load pending memos for customer.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchPendingMemos();
    }, [selectedCustomer, addToast]);

    const handleSelectMemo = (memoNo: string, checked: boolean) => {
        setSelectedMemoNos(prev => checked ? [...prev, memoNo] : prev.filter(no => no !== memoNo));
    };
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedMemoNos(pendingMemos.map(m => m.trips_memo_no));
        } else {
            setSelectedMemoNos([]);
        }
    }

    const customerOptions = useMemo(() => customers.map(c => ({ value: c.customers_name, label: c.customers_name })), [customers]);
    
    if (showInvoiceForm) {
        return <InvoiceForm 
                    memoNosToLoad={selectedMemoNos} 
                    invoiceIdToLoad={null}
                    onSaveSuccess={onSaveSuccess} 
                    onCancel={() => setShowInvoiceForm(false)} 
                />;
    }

    return (
        <Card title="Create Invoice from Memos">
            <div className="space-y-6">
                <div className="w-full md:w-1/2">
                     <ComboBox
                        id="customer-select"
                        label="1. Select a Customer"
                        value={selectedCustomer}
                        onChange={(value) => setSelectedCustomer(String(value))}
                        options={customerOptions}
                        placeholder="Choose a customer..."
                    />
                </div>

                {selectedCustomer && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">2. Select Pending Memos</h3>
                        {isLoading ? <Spinner /> : pendingMemos.length > 0 ? (
                            <div className="overflow-x-auto max-h-[50vh] border rounded-lg">
                                <table className="min-w-full bg-white text-sm">
                                    <thead className="bg-gray-200 sticky top-0">
                                        <tr>
                                            <th className="p-2 text-left w-10">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    checked={pendingMemos.length > 0 && selectedMemoNos.length === pendingMemos.length}
                                                />
                                            </th>
                                            <th className="p-2 text-left font-semibold text-gray-700">Memo No</th>
                                            <th className="p-2 text-left font-semibold text-gray-700">Date</th>
                                            <th className="p-2 text-left font-semibold text-gray-700">Vehicle No</th>
                                            <th className="p-2 text-right font-semibold text-gray-700">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingMemos.map((memo) => (
                                            <tr key={memo.trips_memo_no} className="border-t hover:bg-gray-50">
                                                <td className="p-2">
                                                    <input 
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={selectedMemoNos.includes(memo.trips_memo_no)}
                                                        onChange={(e) => handleSelectMemo(memo.trips_memo_no, e.target.checked)}
                                                    />
                                                </td>
                                                <td className="p-2 font-medium">{memo.trips_memo_no}</td>
                                                <td className="p-2">{memo.trip_operated_date1}</td>
                                                <td className="p-2">{memo.trips_vehicle_no}</td>
                                                <td className="p-2 text-right">{parseFloat(memo.trips_balance).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">No pending memos found for this customer.</p>
                        )}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button onClick={() => setShowInvoiceForm(true)} disabled={selectedMemoNos.length === 0}>
                        Generate Invoice ({selectedMemoNos.length} memos selected)
                    </Button>
                </div>
            </div>
        </Card>
    )
}