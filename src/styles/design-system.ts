export const glassmorphism = {
  // Base glassmorphism styles
  base: "backdrop-blur-md bg-background/40 border border-white/20",
  
  // Card variations
  card: {
    base: "rounded-xl backdrop-blur-md bg-card/40 border border-white/20 shadow-lg",
    hover: "hover:border-primary/50 hover:shadow-primary/10 transition-all duration-300",
    interactive: "hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200",
  },
  
  // Button variations
  button: {
    primary: "bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg hover:shadow-primary/20",
    secondary: "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20",
    ghost: "hover:bg-white/10 backdrop-blur-sm",
  },
  
  // Input variations
  input: {
    base: "bg-white/10 backdrop-blur-md border-white/20 focus:border-primary/50",
    search: "bg-white/5 backdrop-blur-sm border-white/10 focus:border-primary/30",
  },
  
  // Modal variations
  modal: {
    base: "backdrop-blur-xl bg-background/60 border border-white/20 shadow-2xl",
    header: "bg-gradient-to-r from-primary/10 to-primary/5 border-b border-white/10",
    footer: "bg-gradient-to-t from-primary/5 to-transparent border-t border-white/10",
  },
  
  // Navigation variations
  nav: {
    base: "backdrop-blur-md bg-background/40 border-b border-white/20",
    item: "hover:bg-white/10 active:bg-white/20",
  },
  
  // Tree and graph variations
  tree: {
    node: "backdrop-blur-sm bg-white/5 border border-white/10 hover:border-primary/30",
    edge: "stroke-white/20 hover:stroke-primary/50",
  },
  
  // Badge variations
  badge: {
    base: "rounded-full backdrop-blur-sm bg-white/10 border border-white/20",
    primary: "bg-primary/20 text-primary border-primary/30",
    success: "bg-green-500/20 text-green-500 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    error: "bg-red-500/20 text-red-500 border-red-500/30",
  },
  
  // Animation durations
  animation: {
    fast: "duration-200",
    normal: "duration-300",
    slow: "duration-500",
  },
  
  // Shadow variations
  shadow: {
    sm: "shadow-lg shadow-black/5",
    md: "shadow-xl shadow-black/10",
    lg: "shadow-2xl shadow-black/15",
  },
  
  // Gradient variations
  gradient: {
    primary: "bg-gradient-to-r from-primary/90 to-primary/60",
    subtle: "bg-gradient-to-b from-background/50 to-background/30",
    glass: "bg-gradient-to-b from-white/10 to-white/5",
  },
};

// Common layout styles
export const layout = {
  container: "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  section: "py-12 sm:py-16 lg:py-20",
  grid: {
    base: "grid gap-6",
    cols: {
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    },
  },
  flex: {
    center: "flex items-center justify-center",
    between: "flex items-center justify-between",
    start: "flex items-center justify-start",
    end: "flex items-center justify-end",
  },
};

// Typography styles
export const typography = {
  h1: "text-4xl font-bold tracking-tight",
  h2: "text-3xl font-semibold tracking-tight",
  h3: "text-2xl font-semibold",
  h4: "text-xl font-semibold",
  body: "text-base leading-relaxed",
  small: "text-sm text-muted-foreground",
};

// Spacing utilities
export const spacing = {
  section: "space-y-8",
  content: "space-y-4",
  items: "space-y-2",
};

// Z-index layers
export const zIndex = {
  base: "z-0",
  dropdown: "z-10",
  sticky: "z-20",
  fixed: "z-30",
  modal: "z-40",
  popover: "z-50",
  tooltip: "z-60",
}; 