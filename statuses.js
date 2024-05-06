
class OrderStatuses{
    static UPLOADED_ORDER_NEW = 4
    static UPLOADED_ORDER_REPROCESS_SCHEDULED = 3
    static WOOCOMMERCE_ORDER_REPROCESS_SCHEDULED = 3
    
    static order_requested = 	"order_requested"
    static order_accepted= 'order_accepted'
    static order_confirmed = 	'order_confirmed'
    static customer_cancelled=  'customer_cancelled'
    static seller_cancelled=  'seller_cancelled'
    
    static payment_pending = 	'payment_pending'
    static payment_failed = 	'payment_failed'
    static payment_verified = 	'payment_verified'
    
    static invoice_pending = 	'invoice_pending'
    static invoice_failed = 	'invoice_failed'
    static invoice_generated = 	'invoice_generated'
    
    static dispatched = 	'invoice_pending'
    static shipped = 	'invoice_failed'
    static shipping_denied = 	'invoice_generated'
    
    static completed = 	'completed'
    
    static return_requested = 	'return_requested'
    static return_approved = 	'return_approved'
    static return_denied = 	'return_denied'
    static return_in_progress = 	'return_in_progress'
    static return_completed = 	'return_completed'
    
    static refunded = 	'refunded'
}

const API_BASE_URL = "http://erp.thesellerstack.com:3001";
//const API_BASE_URL = "http://localhost:3001";

module.exports = {
    OrderStatuses, API_BASE_URL
}
