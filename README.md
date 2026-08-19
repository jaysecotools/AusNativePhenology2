Aus Plant Phenology - Conservation Tool

A comprehensive web application for exploring and analyzing Australian native plant phenology data, designed for conservation research and environmental management.

---

📋 Overview

Aus Plant Phenology is an interactive data visualization tool that allows researchers, conservationists, and plant enthusiasts to explore flowering and seeding patterns of Australian native plants. The application provides filtering capabilities, visual charts, and species data management to support conservation planning and ecological research.

---

✨ Features

Core Functionality

· 📊 Interactive Charts: Visual representation of flowering and seeding patterns through bar charts
· 🔍 Advanced Filtering: Filter species by state/territory, flowering month, seeding month, and plant family
· 📝 Species List: Dynamically updated list of species matching current filters
· 📦 Data Export: Export filtered data as JSON for external analysis
· 🎨 Theme Options: Toggle between light/dark mode and high contrast accessibility modes

Data Management

· Multiple Datasets: Choose from several pre-loaded datasets:
  · Complete Database
  · Sample Data
  · Compiled Database
  · Complete with Common Names
  · Tasmanian Natives
· Real-time Updates: Charts and species list update instantly when filters change

Accessibility Features

· Screen reader compatible with proper ARIA labels
· Keyboard navigation support
· High contrast mode option
· Clear visual hierarchy and semantic HTML

---

🛠️ Technical Stack

Frontend Technologies

· HTML5: Semantic markup with accessibility features
· CSS3: Responsive design with dark/light mode support
· JavaScript (ES6+): Application logic and data processing
· Chart.js v3.9.1: Data visualization library
· PapaParse v5.3.0: CSV parsing library

---

📁 File Structure

```
aus-plant-phenology/
├── index.html          # Main application interface
├── style.css           # Application styles and themes
├── app.js              # Core application logic
├── data/               # Dataset directory
│   ├── aus_native_phenology_complete.csv
│   ├── sample_phenology_data.csv
│   ├── my_compiled_database.csv
│   ├── aus_native_phenology_complete_with_common_names.csv
│   └── TAS_Natives.csv
└── README.md           # Documentation
```

---

🚀 Getting Started

Prerequisites

· A modern web browser (Chrome, Firefox, Safari, Edge)
· Local web server for best performance (optional)

Quick Start

1. Clone or download the repository:
   ```bash
   git clone https://github.com/yourusername/aus-plant-phenology.git
   cd aus-plant-phenology
   ```
2. Open the application:
   · Simply open index.html in your web browser
   · Or serve with a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js (with serve)
     npx serve
     ```
3. Load your first dataset: Use the dataset selector dropdown and click "Load"

---

💡 How to Use

Basic Navigation

1. Filter Data:
   · Expand the filters panel (click "🔍 Filters" header)
   · Select state, flowering month, seeding month, or plant family
   · Toggle "Both flowering & seeding data" for complete records
   · Use search to find specific species
2. View Charts:
   · Flowering and seeding patterns display automatically
   · Toggle between "Count" and "Percentage" views
   · Charts update with every filter change
3. Explore Species:
   · Scroll through filtered species list
   · View species names, families, and flowering/seeding months
   · Result count shows total matching species
4. Export Data:
   · Click "📥 Export" to download filtered data as JSON
   · Use for external analysis or reporting

Keyboard Shortcuts

· Ctrl/Cmd + F: Focus search input
· Esc: Clear all filters (when search is focused)
· Enter/Space: Toggle filter panel (when filter header is focused)

---

🔧 Data Format

CSV Requirements

Your CSV files should follow this format:

```csv
Species,Family,State,Flowering,Seeding,CommonName
"Acacia longifolia","Fabaceae","NSW","Jan-Feb-Mar","Sep-Oct-Nov","Golden Wattle"
```

Required Columns

Column Description Example
Species Scientific name "Acacia longifolia"
Family Plant family "Fabaceae"
State Australian state/territory "NSW"
Flowering Months (Jan-Dec) "Jan-Feb-Mar"
Seeding Months (Jan-Dec) "Sep-Oct-Nov"
CommonName Common name (optional) "Golden Wattle"

---

📊 Chart Interpretation

Flowering Chart

· Shows distribution of flowering months across filtered species
· Each bar represents the number of species flowering in that month
· Toggle to percentage view for relative comparisons

Seeding Chart

· Shows distribution of seeding months
· Similar format to flowering chart
· Compare flowering vs seeding patterns for phenological studies

---

♿ Accessibility Features

· Screen Reader Support: Comprehensive ARIA labels and landmarks
· Keyboard Navigation: All controls accessible via keyboard
· High Contrast Mode: Enhanced visibility for users with visual impairments
· Color Independence: Charts use patterns alongside colors
· Focus Management: Clear focus indicators for all interactive elements
· Dynamic Content: ARIA live regions for real-time updates

---

🎨 Customization

Theme Options

· 🌓 Theme Toggle: Switch between light and dark modes
· 👁️ High Contrast: Enhanced contrast for better readability

CSS Variables

Core theme colors can be customized in style.css:

```css
:root {
    --bg-body: #f5f5f5;
    --bg-card: #ffffff;
    --text-primary: #222222;
    --text-secondary: #555555;
    --primary: #2e7d32;
    /* ... more variables */
}
```

---

🔍 Troubleshooting

Common Issues

Issue: Charts don't load

· Solution: Check browser console for errors, ensure dataset is properly loaded
· Solution: Verify CSV format matches required columns

Issue: Filters not applying

· Solution: Ensure dataset is loaded (check species count)
· Solution: Check for JavaScript errors in console

Issue: Theme toggle not working

· Solution: Clear browser cache and reload
· Solution: Ensure app.js loads after DOM content

Issue: Data not exporting

· Solution: Check browser permissions for file downloads
· Solution: Try different browser

---

📈 Performance Considerations

· Charts use Chart.js with optimized rendering
· Lazy loading for datasets
· Efficient filtering with O(n) operations
· Minimal DOM manipulation during updates
· Caching of processed data where applicable

---

🧪 Testing

Manual Testing Checklist

☐ All filters apply correctly
☐ Charts update in real-time
☐ Theme switching works
☐ High contrast mode works
☐ Dataset loading functions
☐ Export downloads correct data
☐ Keyboard navigation works
☐ Screen reader compatibility
☐ Responsive design across devices

---

🤝 Contributing

1. Fork the repository
2. Create a feature branch: git checkout -b feature/amazing-feature
3. Commit changes: git commit -m 'Add amazing feature'
4. Push to branch: git push origin feature/amazing-feature
5. Open a Pull Request

Development Guidelines

· Follow semantic HTML and CSS conventions
· Ensure accessibility compliance
· Write clear, commented code
· Test thoroughly before submitting

---

📝 License

This project is © 2026 Jay Rowley. All rights reserved.

---

🙏 Acknowledgments

· Chart.js for data visualization
· PapaParse for CSV parsing
· All conservation researchers who contributed phenology data
· Australian plant conservation community

---

📞 Support

For issues, questions, or contributions, please open an issue on GitHub or contact the developer directly.

Developer: Jay Rowley

---

🔮 Future Enhancements

· Data Upload: User-defined CSV upload
· Advanced Analytics: Phenological pattern analysis
· Regional Comparisons: Side-by-side state comparisons
· Mobile App: Native mobile application
· API Integration: Real-time data updates
· Species Profiles: Detailed species information pages
· Seasonal Analysis: Historical data visualization

---

Happy exploring! 🌿 Use this tool to support conservation efforts and deepen understanding of Australia's unique flora.
