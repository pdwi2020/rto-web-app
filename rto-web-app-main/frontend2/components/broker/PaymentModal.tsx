"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { processPayment, type PaymentData } from "@/lib/api"
import { CreditCard, Smartphone, Building2, CheckCircle } from "lucide-react"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: number
  feeBreakdown: {
    base_fee: number
    service_fee: number
    broker_commission: number
    tax_gst: number
    total: number
  }
}

export function PaymentModal({ open, onOpenChange, applicationId, feeBreakdown }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("UPI")
  const [processing, setProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [transactionId, setTransactionId] = useState("")

  const handlePayment = async () => {
    setProcessing(true)

    try {
      const paymentData: PaymentData = {
        application_id: applicationId,
        amount: feeBreakdown.total,
        payment_method: paymentMethod,
        fee_breakdown: JSON.stringify(feeBreakdown),
      }

      const result = await processPayment(paymentData)

      if (result.success) {
        setPaymentSuccess(true)
        setTransactionId(result.transaction_id)
      }
    } catch (error) {
      console.error("Payment failed:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const handleClose = () => {
    setPaymentSuccess(false)
    setTransactionId("")
    onOpenChange(false)
  }

  if (paymentSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Payment Successful!
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-lg font-semibold">₹{feeBreakdown.total.toFixed(2)}</p>
            <p className="mt-2 text-sm text-neutral-600">Transaction ID:</p>
            <p className="font-mono text-sm font-semibold">{transactionId}</p>
            <p className="mt-4 text-sm text-neutral-600">
              Payment has been processed successfully. Application will be updated shortly.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Complete payment for Application #{applicationId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Fee Breakdown */}
          <Card>
            <CardContent className="p-4">
              <h4 className="mb-3 font-semibold">Fee Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base Fee</span>
                  <span>₹{feeBreakdown.base_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee</span>
                  <span>₹{feeBreakdown.service_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Broker Commission</span>
                  <span>₹{feeBreakdown.broker_commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{feeBreakdown.tax_gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold">
                  <span>Total Amount</span>
                  <span>₹{feeBreakdown.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    UPI
                  </div>
                </SelectItem>
                <SelectItem value="Card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Debit/Credit Card
                  </div>
                </SelectItem>
                <SelectItem value="NetBanking">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Net Banking
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
            <p>This is a demo payment. No actual transaction will be processed.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={processing}>
            {processing ? "Processing..." : `Pay ₹${feeBreakdown.total.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
