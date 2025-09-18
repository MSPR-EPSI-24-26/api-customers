# Métriques Prometheus pour API Customers

## Endpoints disponibles

### `/metrics`
Endpoint pour Prometheus qui expose toutes les métriques au format OpenMetrics.

## Métriques disponibles

### Métriques par défaut (collectées automatiquement)
- `process_cpu_user_seconds_total` - Temps CPU utilisé par le processus
- `process_cpu_system_seconds_total` - Temps CPU système utilisé par le processus
- `process_cpu_seconds_total` - Total du temps CPU utilisé
- `process_start_time_seconds` - Timestamp de démarrage du processus
- `process_resident_memory_bytes` - Mémoire résidente utilisée
- `nodejs_heap_size_total_bytes` - Taille totale du heap Node.js
- `nodejs_heap_size_used_bytes` - Taille utilisée du heap Node.js
- `nodejs_external_memory_bytes` - Mémoire externe Node.js
- `nodejs_heap_space_size_total_bytes` - Taille totale des espaces de heap
- `nodejs_heap_space_size_used_bytes` - Taille utilisée des espaces de heap
- `nodejs_heap_space_size_available_bytes` - Taille disponible des espaces de heap
- `nodejs_version_info` - Informations de version Node.js

### Métriques personnalisées

#### `http_requests_total`
- **Type**: Counter
- **Description**: Nombre total de requêtes HTTP
- **Labels**: 
  - `method`: Méthode HTTP (GET, POST, PUT, DELETE)
  - `route`: Route de l'endpoint
  - `status_code`: Code de statut HTTP

#### `http_request_duration_seconds`
- **Type**: Histogram
- **Description**: Durée des requêtes HTTP en secondes
- **Labels**: 
  - `method`: Méthode HTTP
  - `route`: Route de l'endpoint
- **Buckets**: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] secondes

#### `customers_total`
- **Type**: Gauge
- **Description**: Nombre total de clients dans la base de données
- **Mise à jour**: À chaque appel de l'endpoint `GET /customers`

## Configuration Prometheus

Exemple de configuration pour scraper ces métriques :

```yaml
scrape_configs:
  - job_name: 'api-customers'
    static_configs:
      - targets: ['api-customers:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

## Requêtes Prometheus utiles

### Taux de requêtes par seconde
```promql
rate(http_requests_total[5m])
```

### Latence moyenne des requêtes
```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

### Erreurs 5xx par minute
```promql
increase(http_requests_total{status_code=~"5.."}[1m])
```

### Utilisation CPU
```promql
rate(process_cpu_seconds_total[5m])
```

### Utilisation mémoire
```promql
process_resident_memory_bytes
```