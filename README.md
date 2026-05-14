# Muveste Poultry Management System

Welcome to **Muveste**, a comprehensive poultry management platform designed for tracking operations across broiler farms, butcheries, and finance departments.

---

## 🚀 Tech Stack

This project is built with a modern, scalable stack to ensure performance and reliability:

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Library**: [React 18](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Firebase](https://firebase.google.com/) (Firestore, Authentication, Admin SDK)
- **Data Synchronization**: [Google Sheets API](https://developers.google.com/sheets/api)
- **Email Integration**: [EmailJS](https://www.emailjs.com/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)

---

## 🔐 Project Accounts & Credentials

The management of this project is divided between two primary email accounts. **Both accounts use the same password: `Muveste8388@`**.

### 1. API & Services Account
- **Email**: `muvestechickengroup@gmail.com`
- **Used for**:
  - **Firebase Console**: Managing database, storage, and auth.
  - **Google Sheets**: Storing and extracting farm reporting data.
  - **EmailJS**: Configuring email templates and SMTP settings.
  - **App Settings**: General API configurations.

### 2. Infrastructure & Operations Account
- **Email**: *(Used for GitHub and Cloud Infrastructure)*
- **Used for**:
  - **GitHub**: Hosting the source code repository.
  - **Vercel**: Managing frontend deployments and SSL.
  - **Cloudflare**: Domain management and DNS for `muveste.com`.
  - **Google Cloud Console**: Project-level API management.
  - **Google Analytics**: Tracking website traffic and performance.

> [!WARNING]
> Keep these credentials secure. Ensure that any `.env.local` files containing secret keys are never committed to version control.

---

## 💻 Local Development

Follow these steps to set up the project on your local machine:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/30plusltd-stack/muveste.git
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add the necessary Firebase and Google API keys (refer to the API & Services account).

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Access the App**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Core Features
- **Admin Dashboard**: Real-time overview of all farm metrics.
- **Butchery Management**: Location-specific reporting (Nyabugogo, Kibungo, Rwamagana).
- **Broiler Farm Tracking**: Mortality rates, feed consumption, and growth tracking.
- **Finance Portal**: Expense tracking, profit analysis, and monthly reports.

---

*Muveste — Empowering Poultry Management.*
