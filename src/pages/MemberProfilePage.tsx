import { useParams, useNavigate } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { usePayments } from '@/hooks/usePayments';
import { usePlans } from '@/hooks/usePlans';
import { useRenewMembership } from '@/hooks/useRenewMembership';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, MessageCircle, CreditCard, RefreshCw, User, Phone, Calendar, Shield } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { RenewDialog } from '@/components/RenewDialog';
import { useState } from 'react';

function getWhatsAppUrl(phone: string, name: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const message = encodeURIComponent(`Hi ${name}, this is regarding your gym membership.`);
  return `https://wa.me/${fullPhone}?text=${message}`;
}

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { data: plans } = usePlans();
  const [renewOpen, setRenewOpen] = useState(false);

  const member = members?.find(m => m.id === memberId);
  const memberPayments = payments?.filter(p => p.member_id === memberId) ?? [];
  const totalPaid = memberPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/app/members')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Members
        </Button>
        <p className="text-muted-foreground">Member not found.</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(member.expiry_date);
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = differenceInDays(expiry, today);
  const isExpired = daysLeft < 0;
  const isExpiring = !isExpired && daysLeft <= 3;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/app/members')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Members
      </Button>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-10 w-10 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-display">{member.name}</h1>
            {isExpired ? (
              <Badge variant="destructive">Expired</Badge>
            ) : isExpiring ? (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-500/10">{daysLeft}d left</Badge>
            ) : (
              <Badge variant="default">Active</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{member.plans?.name ?? 'No plan'}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setRenewOpen(true)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Renew
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/payments')}>
            <CreditCard className="h-4 w-4 mr-2" /> Add Payment
          </Button>
          <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" asChild>
            <a href={getWhatsAppUrl(member.phone, member.name)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
            </a>
          </Button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Phone, label: 'Phone', value: member.phone },
          { icon: Shield, label: 'Plan', value: member.plans?.name ?? '—' },
          { icon: Calendar, label: 'Join Date', value: format(new Date(member.start_date), 'dd MMM yyyy') },
          {
            icon: Calendar, label: 'Expiry Date',
            value: format(new Date(member.expiry_date), 'dd MMM yyyy'),
            className: cn(isExpired && 'text-destructive', isExpiring && 'text-yellow-600'),
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={cn("font-medium text-sm", item.className)}>{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Paid */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Amount Paid</span>
          <span className="text-2xl font-bold text-primary">₹{totalPaid.toLocaleString()}</span>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paymentsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : memberPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{format(new Date(p.payment_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="font-medium">₹{Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{p.method.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.note ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
              No payments recorded for this member.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renew Dialog */}
      {plans && (
        <RenewDialog
          open={renewOpen}
          onOpenChange={setRenewOpen}
          member={member}
          plans={plans}
        />
      )}
    </div>
  );
}
