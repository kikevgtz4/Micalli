// frontend/src/components/layout/Footer.tsx
"use client"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Facebook, Twitter, Instagram, Linkedin, Heart } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-16">
        
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand Section */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80">
                <span className="text-sm font-bold text-primary-foreground">R</span>
              </div>
              <span className="text-xl font-bold">Roomigo</span>
            </div>
            
            <p className="max-w-md text-muted-foreground">
              Making student housing simple, safe, and affordable in Monterrey. 
              Find your perfect room and roommate with confidence.
            </p>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                🛡️ Verified Platform
              </Badge>
              <Badge variant="secondary">
                🏆 #1 in Monterrey
              </Badge>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="Facebook">
                  <Facebook className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/properties" className="text-muted-foreground transition-colors hover:text-foreground">
                  Find Rooms
                </Link>
              </li>
              <li>
                <Link href="/roommates" className="text-muted-foreground transition-colors hover:text-foreground">
                  Find Roommates
                </Link>
              </li>
              <li>
                <Link href="/universities" className="text-muted-foreground transition-colors hover:text-foreground">
                  Universities
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-muted-foreground transition-colors hover:text-foreground">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground transition-colors hover:text-foreground">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/help" className="text-muted-foreground transition-colors hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-muted-foreground transition-colors hover:text-foreground">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground transition-colors hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>© 2024 Roomigo. All rights reserved. Made with</span>
            <Heart className="h-4 w-4 fill-current text-red-500" />
            <span>in Monterrey</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Available in:</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-auto p-1">
                English
              </Button>
              <span className="text-muted-foreground">|</span>
              <Button variant="ghost" size="sm" className="h-auto p-1">
                Español
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}