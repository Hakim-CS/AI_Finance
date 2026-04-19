import { ManualEntryForm } from "@/components/expense/ManualEntryForm";
import { VoiceInput } from "@/components/expense/VoiceInput";
import { ReceiptUpload } from "@/components/expense/ReceiptUpload";
import { useTranslation } from "react-i18next";

export default function AddExpense() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('addExpensePage.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('addExpensePage.subtitle')}
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
