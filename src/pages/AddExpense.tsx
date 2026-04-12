import { ManualEntryForm } from "@/components/expense/ManualEntryForm";
import { VoiceInput } from "@/components/expense/VoiceInput";
import { ReceiptUpload } from "@/components/expense/ReceiptUpload";

export default function AddExpense() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add Expense</h1>
        <p className="text-muted-foreground mt-1">
          Choose your preferred method to record an expense
        </p>
      </div>

      {/* Input Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ManualEntryForm />
        <VoiceInput />
        <ReceiptUpload />
      </div>
    </div>
  );
}
