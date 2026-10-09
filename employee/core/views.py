import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .ml_service import predict_attrition

def index(request):
    """Render the main prediction interface."""
    return render(request, 'index.html')


@csrf_exempt
def predict(request):
    """
    Endpoint for predicting employee attrition.
    Supports both JSON POST (for async JS fetch) and standard Form POST.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed.'}, status=405)

    try:
        # Check if content type is JSON
        if request.content_type == 'application/json':
            data = json.loads(request.body.decode('utf-8'))
        else:
            data = request.POST.dict()

        result = predict_attrition(data)

        # If it's an AJAX / fetch request or JSON expected
        if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json':
            return JsonResponse({'success': True, 'data': result})

        # Otherwise render template with results for traditional form submission
        return render(request, 'index.html', {'result': result, 'form_data': data})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
