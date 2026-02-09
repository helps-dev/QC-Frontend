import { ArrowLeft } from '../Icons3D'

interface PrivacyPolicyProps {
  onBack: () => void
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: December 29, 2025</p>

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Mexa DEX ("we", "our", or "the Platform") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, and safeguard information when you 
              use our decentralized exchange platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">As a decentralized platform, we collect minimal information:</p>
            
            <h3 className="text-lg font-medium text-white mt-4 mb-2">2.1 Blockchain Data</h3>
            <p>
              When you interact with our smart contracts, your wallet address and transaction data 
              are recorded on the public MegaETH blockchain. This data is publicly accessible and 
              cannot be deleted.
            </p>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">2.2 Local Storage</h3>
            <p>
              We store certain preferences locally in your browser, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Custom imported tokens</li>
              <li>Slippage tolerance settings</li>
              <li>Transaction deadline preferences</li>
              <li>UI preferences</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">2.3 Analytics</h3>
            <p>
              We may collect anonymous usage statistics to improve the Platform, such as page views 
              and feature usage. This data does not identify individual users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Information We Do NOT Collect</h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Personal identification information (name, email, phone)</li>
              <li>Private keys or seed phrases</li>
              <li>IP addresses for tracking purposes</li>
              <li>Location data</li>
              <li>Cookies for advertising</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How We Use Information</h2>
            <p>The limited information we collect is used to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Provide and maintain the Platform</li>
              <li>Display your transaction history and positions</li>
              <li>Improve user experience</li>
              <li>Ensure platform security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your information to third parties. Blockchain 
              transaction data is inherently public and can be viewed by anyone using blockchain 
              explorers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Third-Party Services</h2>
            <p>The Platform integrates with third-party services:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>Wallet Providers:</strong> MetaMask, Trust Wallet, WalletConnect - governed by their own privacy policies</li>
              <li><strong>RPC Providers:</strong> For blockchain communication</li>
              <li><strong>Subgraph Services:</strong> For indexing blockchain data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Data Security</h2>
            <p>
              We implement appropriate security measures to protect against unauthorized access. 
              However, no method of transmission over the Internet is 100% secure. Your wallet 
              security is your responsibility.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Clear local storage data from your browser</li>
              <li>Disconnect your wallet at any time</li>
              <li>Use the Platform without creating an account</li>
            </ul>
            <p className="mt-2">
              Note: Blockchain transactions cannot be deleted or modified due to the immutable 
              nature of blockchain technology.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Children's Privacy</h2>
            <p>
              The Platform is not intended for users under 18 years of age. We do not knowingly 
              collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this 
              page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please reach out through our 
              official social media channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
