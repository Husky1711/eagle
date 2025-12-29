import { Link } from 'react-router-dom'
import Container from '../common/Container'

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-auto">
      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">LogiSmart</h3>
            <p className="text-sm">
              Smart logistics solutions. Compare multiple courier partners and get the best rates.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing Calculator</Link></li>
              <li><Link to="/tracking" className="hover:text-white transition-colors">Track Parcel</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <p className="text-sm">
              Follow us on social media for updates and news.
            </p>
          </div>
        </div>
        <div className="border-t border-neutral-800 py-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} LogiSmart. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  )
}

export default Footer

