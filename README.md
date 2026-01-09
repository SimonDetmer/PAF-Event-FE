# EventM – Frontend

## Overview

The frontend of **EventM** is an Angular-based single-page application that provides a user-friendly interface for event management and ticket purchasing.  
It focuses on clarity, responsiveness, and clear feedback for concurrency-related errors.

---

## Technology Stack

- Angular
- TypeScript
- Angular Material
- RxJS
- ngx-echarts (ECharts)
- HTML / CSS

---

## Application Structure

The frontend is organized into:

- **Components**
  - Event overview
  - Dashboard (manager & customer views)
  - Ticket purchase flow
  - Reports and visualizations

- **Services**
  - Authentication service
  - Order service
  - API communication services

- **Models**
  - User
  - Event
  - Order
  - Ticket

---

## Role-Based Views

### Event Manager
- Create and manage events
- View ticket sales and revenue
- Access reports and charts

### Customer
- Browse upcoming events
- Purchase tickets
- View past orders and spending summaries

---

## Ticket Purchase Flow

1. User selects tickets and adds them to the cart.
2. The frontend stores the current event version.
3. During checkout, the version is sent to the backend.
4. If a conflict occurs:
  - The backend returns HTTP 409.
  - The frontend displays a clear error message.
  - The user is prompted to refresh and retry.

---

## Visualization

The dashboard includes multiple visualizations:

- Ticket sales over time
- Revenue distribution
- Ticket distribution per event
- Booking time heatmap
- Location occupancy

All charts are implemented using **ECharts** via `ngx-echarts`.

---

## Error Handling & UX

- Loading indicators during API calls
- Clear error messages for failed orders
- Graceful handling of concurrency conflicts
- Minimal UI complexity for presentation clarity

---

## Running the Frontend

### Requirements
- Node.js (LTS)
- npm

### Steps

1. Install dependencies:
   ```bash
   npm install
   
2. Start the development server:
   ng serve

The application will be available at:
http://localhost:4200

---

## Notes

The frontend intentionally keeps complexity low while clearly demonstrating:
- state handling
- error feedback
- concurrency-aware user interactions
