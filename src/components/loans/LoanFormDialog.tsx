import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarIcon, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLoans, type Loan, type LoanType } from "@/context/LoansContext";
import { useToast } from "@/hooks/use-toast";
import { formatNumberInput, unformatNumberInput } from "@/hooks/useFormattedNumberInput";

interface LoanFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loan?: Loan | null;
}

export function LoanFormDialog({ open, onOpenChange, loan }: LoanFormDialogProps) {
    const { t } = useTranslation();
    const { addLoan, updateLoan } = useLoans();
    const { toast } = useToast();

    const [type, setType] = useState<LoanType>("lent");
    const [amount, setAmount] = useState("");
    const [person, setPerson] = useState("");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            if (loan) {
                setType(loan.type);
                setAmount(String(loan.amount));
                setPerson(loan.person);
                setDate(new Date(loan.date));
                setDescription(loan.description ?? "");
            } else {
                setType("lent");
                setAmount("");
                setPerson("");
                setDate(new Date());
                setDescription("");
            }
            setErrors({});
        }
    }, [open, loan]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        const numAmount = parseFloat(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0)
            newErrors.amount = t("loansPage.errors.amountInvalid");
        if (!person.trim()) newErrors.person = t("loansPage.errors.personRequired");
        if (!date) newErrors.date = t("loansPage.errors.dateRequired");

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            return;
        }

        const payload = {
            type,
            amount: parseFloat(unformatNumberInput(amount)),
            person: person.trim(),
            date: date!.toISOString(),
            description: description.trim() || undefined,
        };

        try {
            if (loan) {
                await updateLoan(loan.id, payload);
                toast({ title: t("loansPage.toasts.updated") });
            } else {
                await addLoan(payload);
                toast({ title: t("loansPage.toasts.added") });
            }
            onOpenChange(false);
        } catch {
            toast({ title: t("common.error"), variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{loan ? t("loansPage.editLoan") : t("loansPage.addLoan")}</DialogTitle>
                    <DialogDescription>{t("loansPage.formDescription")}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type Toggle */}
                    <div className="space-y-2">
                        <Label>{t("loansPage.type")}</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType("lent")}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all",
                                    type === "lent"
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <ArrowUpRight className="w-4 h-4" />
                                <span className="font-medium">{t("loansPage.lent")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("borrowed")}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all",
                                    type === "borrowed"
                                        ? "border-destructive bg-destructive/5 text-destructive"
                                        : "border-border hover:border-destructive/50"
                                )}
                            >
                                <ArrowDownLeft className="w-4 h-4" />
                                <span className="font-medium">{t("loansPage.borrowed")}</span>
                            </button>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="loan-amount">{t("loansPage.amount")}</Label>
                        <Input
                            id="loan-amount"
                            type="text"
                            inputMode="decimal"
                            min="0"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                        />
                        {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                    </div>

                    {/* Person */}
                    <div className="space-y-2">
                        <Label htmlFor="loan-person">{t("loansPage.person")}</Label>
                        <Input
                            id="loan-person"
                            placeholder={t("loansPage.personPlaceholder")}
                            value={person}
                            onChange={(e) => setPerson(e.target.value)}
                        />
                        {errors.person && <p className="text-sm text-destructive">{errors.person}</p>}
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label>{t("loansPage.date")}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>{t("loansPage.pickDate")}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="loan-desc">{t("loansPage.descriptionOptional")}</Label>
                        <Textarea
                            id="loan-desc"
                            placeholder={t("loansPage.descriptionPlaceholder")}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t("common.cancel")}
                        </Button>
                        <Button type="submit" className="gradient-primary hover:opacity-90">
                            {loan ? t("common.saveChanges") : t("loansPage.addLoan")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}