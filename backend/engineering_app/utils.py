import uuid


from .models import AuditTrail

def log_audit_action(user, action, model_name, object_id=None, description=""):
    AuditTrail.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=object_id,
        description=description,
    )
def generate_wo_number():
    return "WO-" + uuid.uuid4().hex[:8].upper()