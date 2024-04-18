const UPLOADED_ORDER_NEW = 4
const UPLOADED_ORDER_REPROCESS_SCHEDULED = 3
const WOOCOMMERCE_ORDER_REPROCESS_SCHEDULED = 3

const order_requested = 	"order_requested"
const order_accepted= 'order_accepted'
const order_confirmed = 	'order_confirmed'
const customer_cancelled=  'customer_cancelled'
const seller_cancelled=  'seller_cancelled'

const payment_pending = 	'payment_pending'
const payment_failed = 	'payment_failed'
const payment_verified = 	'payment_verified'

const invoice_pending = 	'invoice_pending'
const invoice_failed = 	'invoice_failed'
const invoice_generated = 	'invoice_generated'

const dispatched = 	'invoice_pending'
const shipped = 	'invoice_failed'
const shipping_denied = 	'invoice_generated'

const completed = 	'completed'

const return_requested = 	'return_requested'
const return_approved = 	'return_approved'
const return_denied = 	'return_denied'
const return_in_progress = 	'return_in_progress'
const return_completed = 	'return_completed'

const refunded = 	'refunded'
module.exports = {
    UPLOADED_ORDER_NEW,UPLOADED_ORDER_REPROCESS_SCHEDULED,WOOCOMMERCE_ORDER_REPROCESS_SCHEDULED
}
