import { API_BASE } from "@/lib/api";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePreferences, CURRENCIES } from "@/context/PreferencesContext";
import { formatNumberInput, unformatNumberInput } from "@/hooks/useFormattedNumberInput";

export function ManualEntryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, error: categoriesFetchError } = useCategories();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { formatAmount, currency } = usePreferences();
  const currencySymbol = CURRENCIES[currency]?.symbol ?? "₺";

  const formSchema = z.object({
    amount: z.string().min(1, t('addExpensePage.manual.errors.amountRequired')).refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      t('addExpensePage.manual.errors.amountPositive')
    ),
    category: z.string().min(1, t('addExpensePage.manual.errors.categoryRequired')),
    description: z.string().min(1, t('addExpensePage.manual.errors.descRequired')).max(100, t('addExpensePage.manual.errors.descTooLong')),
    date: z.date({ required_error: t('addExpensePage.manual.errors.dateRequired') }),
    notes: z.string().max(500, t('addExpensePage.manual.errors.notesTooLong')).optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      category: "",
      description: "",
      date: new Date(),
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    if (!token) {
      toast({
        title: t('common.error'),
        description: t('common.loginRequired'),
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(unformatNumberInput(values.amount)),
          categoryId: values.category,
          description: values.description,
          date: values.date.toISOString(),
          notes: values.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add expense');
      }

      toast({
        title: t('addExpensePage.manual.added'),
        description: t('addExpensePage.manual.addedDesc', {
          amount: formatAmount(parseFloat(unformatNumberInput(values.amount))),
          description: values.description,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      form.reset();
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">{t('addExpensePage.manual.title')}</CardTitle>
        <CardDescription>{t('addExpensePage.manual.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addExpensePage.manual.amount')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                      <Input
                        {...field}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        className="pl-7"
                        onChange={(e) => field.onChange(formatNumberInput(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addExpensePage.manual.category')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          categoriesLoading ? t('common.loading') :
                          categoriesError ? t('common.error') :
                          t('addExpensePage.manual.selectCategory')
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoriesLoading ? (
                        <SelectItem value="loading" disabled>
                          {t('common.loading')}
                        </SelectItem>
                      ) : categoriesError ? (
                        <SelectItem value="error" disabled>
                          {t('common.error')}: {categoriesFetchError?.message}
                        </SelectItem>
                      ) : categories?.length === 0 ? (
                        <SelectItem value="no-categories" disabled>
                          {t('addExpensePage.manual.selectCategory')}
                        </SelectItem>
                      ) : (
                        categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {t(`categories.${cat.id}`, { defaultValue: cat.name })}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addExpensePage.manual.descriptionLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('addExpensePage.manual.descriptionPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('addExpensePage.manual.date')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>{t('addExpensePage.manual.pickDate')}</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addExpensePage.manual.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('addExpensePage.manual.notesPlaceholder')}
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full gradient-primary hover:opacity-90"
              disabled={isSubmitting || categoriesLoading || categoriesError || !token}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('addExpensePage.manual.saving')}
                </>
              ) : (
                t('addExpensePage.manual.addExpense')
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}