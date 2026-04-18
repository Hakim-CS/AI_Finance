import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

interface ExpenseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onClearFilters: () => void;
}

export function ExpenseFilters({
  search, onSearchChange, category, onCategoryChange,
  sortBy, onSortChange, dateRange, onDateRangeChange, onClearFilters,
}: ExpenseFiltersProps) {
  const { data: categories, isLoading, isError, error } = useCategories();
  const { t } = useTranslation();
  const hasActiveFilters = search || category !== "all" || sortBy !== "date-desc" || dateRange;

  const getCategoryName = (categoryId: string) => {
    if (isLoading) return t("common.loading");
    if (isError) return t("common.error");
    return categories?.find(c => c.id === categoryId)?.name || t("expenses.unknown_category");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("expenses.search")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("expenses.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("expenses.all_categories")}</SelectItem>
            {isLoading ? (
              <SelectItem value="loading" disabled>{t("common.loading")}</SelectItem>
            ) : isError ? (
              <SelectItem value="error" disabled>{t("common.error")}: {error?.message}</SelectItem>
            ) : categories?.length === 0 ? (
              <SelectItem value="no-categories" disabled>{t("expenses.no_categories")}</SelectItem>
            ) : (
              categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={t("expenses.sort_by")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">{t("expenses.sort_newest")}</SelectItem>
            <SelectItem value="date-asc">{t("expenses.sort_oldest")}</SelectItem>
            <SelectItem value="amount-desc">{t("expenses.sort_highest")}</SelectItem>
            <SelectItem value="amount-asc">{t("expenses.sort_lowest")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full sm:w-auto justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>{format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}</>
                ) : format(dateRange.from, "LLL dd, yyyy")
              ) : t("expenses.date_range")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus mode="range" defaultMonth={dateRange?.from}
              selected={dateRange} onSelect={onDateRangeChange}
              numberOfMonths={2} className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{t("expenses.active_filters")}:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              {t("expenses.search_label")}: {search}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onSearchChange("")} />
            </Badge>
          )}
          {category !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {getCategoryName(category)}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onCategoryChange("all")} />
            </Badge>
          )}
          {dateRange && (
            <Badge variant="secondary" className="gap-1">
              {format(dateRange.from!, "MMM d")} - {dateRange.to ? format(dateRange.to, "MMM d") : "..."}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onDateRangeChange(undefined)} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-destructive hover:text-destructive">
            {t("expenses.clear_all")}
          </Button>
        </div>
      )}
    </div>
  );
}
