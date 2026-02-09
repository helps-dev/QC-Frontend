import { ArrowLeft } from '../Icons3D'

interface TermsOfServiceProps {
  onBack: () => void
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
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

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: December 29, 2025</p>

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Mexa DEX ("the Platform"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              Mexa DEX is a decentralized exchange (DEX) built on the MegaETH blockchain. The Platform provides:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Token swapping services</li>
              <li>Liquidity pool management</li>
              <li>Yield farming opportunities</li>
              <li>Staking services</li>
              <li>Initial DEX Offering (IDO) launchpad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Eligibility</h2>
            <p>
              You must be at least 18 years old and have the legal capacity to enter into these Terms. 
              By using the Platform, you represent that you meet these requirements and that you are not 
              located in a jurisdiction where cryptocurrency trading is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Wallet Connection</h2>
            <p>
              To use the Platform, you must connect a compatible cryptocurrency wallet. You are solely 
              responsible for maintaining the security of your wallet and private keys. We do not have 
              access to your private keys and cannot recover them if lost.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Risks</h2>
            <p>You acknowledge and accept the following risks:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Cryptocurrency prices are highly volatile</li>
              <li>Smart contracts may contain bugs or vulnerabilities</li>
              <li>Transactions on the blockchain are irreversible</li>
              <li>Liquidity provision may result in impermanent loss</li>
              <li>Regulatory changes may affect the availability of services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. No Financial Advice</h2>
            <p>
              The Platform does not provide financial, investment, legal, or tax advice. All information 
              provided is for informational purposes only. You should consult with qualified professionals 
              before making any financial decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Use the Platform for any illegal activities</li>
              <li>Attempt to manipulate markets or engage in wash trading</li>
              <li>Interfere with the proper functioning of the Platform</li>
              <li>Use automated systems to interact with the Platform without permission</li>
              <li>Circumvent any security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Fees</h2>
            <p>
              The Platform charges a 0.5% fee on swaps, which is distributed to liquidity providers. 
              Additional network (gas) fees are required for blockchain transactions and are paid 
              directly to network validators.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Mexa DEX and its operators shall not be liable 
              for any indirect, incidental, special, consequential, or punitive damages, including 
              loss of profits, data, or other intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided "as is" and "as available" without warranties of any kind, 
              either express or implied. We do not guarantee that the Platform will be uninterrupted, 
              secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be effective 
              immediately upon posting. Your continued use of the Platform constitutes acceptance 
              of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
            <p>
              For questions about these Terms, please contact us through our official social media channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
