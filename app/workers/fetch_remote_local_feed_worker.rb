# frozen_string_literal: true

require 'net/http'

class FetchRemoteLocalFeedWorker
  include Sidekiq::Worker
  include ExponentialBackoff

  sidekiq_options queue: 'pull', retry: 3

  def perform
    destinations = AccountDestination.pluck('distinct instance_id')

    destinations.each do |destination|
      since = Status.where("url ilike ?", "https://#{destination}%").pick(:id)
      uri = URI("https://#{destination}/api/v1/timelines/public")

      params = { local: true }
      params.merge!(since_id: since) if since

      uri.merge! "?#{params.to_query}"

      response = Net::HTTP.get(uri)
      response = JSON.parse(response)

      urls = response.map { |status| status["url"] }
      urls.each { |url| puts url }
      FetchReplyWorker.push_bulk(urls)

      sleep 10
    end
  end
end
