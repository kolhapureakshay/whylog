export interface Breadcrumb {
  message: string;
  category?: string;
  data?: any;
  timestamp: string;
}

const breadcrumbs: Breadcrumb[] = [];
let maxItems = 10;

export const BreadcrumbTracker = {
  setMax(max: number) {
      maxItems = max;
  },
  add(message: string, category?: string, data?: any) {
      breadcrumbs.push({
          message,
          category,
          data,
          timestamp: new Date().toISOString()
      });
      if (breadcrumbs.length > maxItems) {
          breadcrumbs.shift();
      }
  },
  get(): Breadcrumb[] {
      return [...breadcrumbs];
  },
  clear() {
      breadcrumbs.length = 0;
  }
};
