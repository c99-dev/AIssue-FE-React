import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  ArrowLeft,
  Github,
  MessageSquare,
  ThumbsUp,
  Code,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import DashboardLayout from '../components/dashboard-layout';
import useNotification from '../hooks/use-notification';
import issueService from '../services/issueService';
import MarkdownRenderer from '../components/markdown-renderer';

export default function IssuePage() {
  const { repoId, issueId } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false); // 분석 시도 완료 여부
  const [activeTab, setActiveTab] = useState('issue');
  const { isConnected } = useNotification();
  console.log(`알림 연결 상태: ${isConnected ? '연결됨' : '끊김'}`);

  useEffect(() => {
    const fetchIssue = async () => {
      setLoading(true);
      setAnalysisComplete(false); // 이슈 변경 시 분석 완료 상태 초기화
      const result = await issueService.getIssueDetail(repoId, issueId);
      if (result.success) {
        const aiAnalysisData = result.data?.aiAnalysis;
        const aiAnalysis = {
          summary: aiAnalysisData?.summary || '',
          relatedFiles: aiAnalysisData?.relatedFiles || [],
          codeSnippets: aiAnalysisData?.codeSnippets || [],
          suggestion:
            aiAnalysisData?.suggestion || result.data?.solutionSuggestion || '',
        };
        console.log('[AIssue] 백엔드에서 받은 AI 분석 결과:', aiAnalysis);

        const issueData = {
          ...result.data,
          repoName:
            result.data.repoName ||
            (result.data.repoFullName
              ? result.data.repoFullName.split('/')[1]
              : ''),
          user: result.data.author,
          createdAt: result.data.createdAtGithub,
          labels: result.data.labels || [],
          comments: result.data.comments || [],
          aiAnalysis,
        };

        setIssue(issueData);

        const hasAnalysis =
          aiAnalysis.summary &&
          aiAnalysis.summary.trim() !== '' &&
          aiAnalysis.summary !== 'AI 요약 정보 없음';

        if (hasAnalysis) {
          setAnalysisComplete(true); // 이미 분석 결과가 있으면 완료로 처리
        } else if (!analyzing) {
          // 저장된 분석 결과가 없고, 현재 분석 중도 아니라면 새로 분석 요청
          // (handleAnalyzeIssue 내부에서 analyzing, analysisComplete 상태 관리)
          handleAnalyzeIssue(issueData);
        }

        if (result.data.issueId) {
          issueService.saveRecentIssue(result.data.issueId);
        }
      }
      setLoading(false);
    };
    fetchIssue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId, issueId]);

  const handleAnalyzeIssue = async (issueData = issue) => {
    if (!issueData || analyzing) return;

    setAnalyzing(true);
    // setAnalysisComplete(false); // 분석 시작 시 이전 완료 상태를 초기화할 수 있으나, UX에 따라 결정
    try {
      const result = await issueService.analyzeIssue(repoId, issueId);

      if (result.success) {
        const aiAnalysis = {
          summary: result.data?.summary || '',
          relatedFiles: result.data?.relatedFiles || [],
          codeSnippets: result.data?.codeSnippets || [],
          suggestion:
            result.data?.solutionSuggestion || result.data?.suggestion || '',
        };
        console.log('[AIissue] 분석 요청 후 받은 AI 분석 결과:', aiAnalysis);

        setIssue((prev) => ({
          ...prev,
          aiAnalysis,
        }));
      } else {
        console.error('분석 실패:', result.error);
        // 실패 시에도 AI 분석 결과는 초기화하거나 이전 상태 유지 (현재는 빈 값으로 설정)
        setIssue((prev) => ({
          ...prev,
          aiAnalysis: {
            summary: '',
            relatedFiles: [],
            codeSnippets: [],
            suggestion: '',
          },
        }));
      }
    } catch (error) {
      console.error('분석 요청 오류:', error);
      setIssue((prev) => ({
        ...prev,
        aiAnalysis: {
          summary: '',
          relatedFiles: [],
          codeSnippets: [],
          suggestion: '',
        },
      }));
    } finally {
      setAnalyzing(false);
      setAnalysisComplete(true); // 분석 시도 완료 (성공/실패 무관)
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <div className="text-lg">이슈 정보를 불러오는 중...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!issue) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-lg text-red-600">이슈를 찾을 수 없습니다</div>
          <Button asChild>
            <Link to={`/repository/${repoId}`}>저장소로 돌아가기</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // AI 분석 결과 표시 부분 수정
  const renderAiAnalysisContent = () => {
    if (analyzing) {
      return (
        <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              AI 분석 중...
            </span>
          </div>
        </div>
      );
    }

    if (!analysisComplete && !issue.aiAnalysis.summary) {
      // 아직 분석 시도 전이거나, 초기 로드 시 분석 결과가 없는 경우
      return (
        <div className="p-4 text-center text-muted-foreground border rounded-lg bg-background">
          AI 분석 정보가 없습니다.
          <Button
            variant="link"
            onClick={() => handleAnalyzeIssue()}
            disabled={analyzing}
            className="ml-2"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${analyzing ? 'animate-spin' : ''}`}
            />
            AI 분석 실행
          </Button>
        </div>
      );
    }

    if (analysisComplete && !issue.aiAnalysis.summary) {
      // 분석은 시도했으나, 표시할 요약 정보가 없는 경우 (예: API가 빈 결과 반환)
      return (
        <div className="p-4 text-center text-muted-foreground border rounded-lg bg-background">
          AI 분석이 완료되었으나 표시할 내용이 없습니다.
          <Button
            variant="link"
            onClick={() => handleAnalyzeIssue()}
            disabled={analyzing}
            className="ml-2"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${analyzing ? 'animate-spin' : ''}`}
            />
            다시 분석
          </Button>
        </div>
      );
    }

    // 분석 완료 및 결과가 있는 경우
    return (
      <div className="border rounded-lg overflow-hidden bg-background">
        <div className="md:w-full p-4">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">
                  AI 분석 요약
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAnalyzeIssue()}
                  disabled={analyzing}
                  className="h-6 w-6 p-0 hover:bg-muted"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${analyzing ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                <MarkdownRenderer>{issue.aiAnalysis.summary}</MarkdownRenderer>
              </div>
            </div>

            {/* 관련 파일 */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-foreground">
                관련 파일
              </h3>
              <ul className="space-y-2">
                {issue.aiAnalysis.relatedFiles &&
                issue.aiAnalysis.relatedFiles.length > 0 ? (
                  issue.aiAnalysis.relatedFiles.map((file, index) => (
                    <li
                      key={index}
                      className="p-2 bg-muted/50 rounded-md border"
                    >
                      <a
                        href={
                          file.githubUrl
                            ? file.githubUrl
                            : `https://github.com/${issue.repoFullName}/blob/main/${file.path}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
                      >
                        <Code className="h-3.5 w-3.5" />
                        <span className="truncate">{file.path}</span>
                      </a>
                      <p className="text-xs text-muted-foreground mt-1">
                        관련도: {file.relevance}%
                      </p>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-2 text-center bg-muted/30 rounded-md">
                    관련 파일이 없습니다.
                  </p>
                )}
              </ul>
            </div>

            {/* 코드 스니펫 */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-foreground">
                코드 스니펫
              </h3>
              {issue.aiAnalysis.codeSnippets &&
              issue.aiAnalysis.codeSnippets.length > 0 ? (
                <Tabs defaultValue="snippet0" className="w-full">
                  <TabsList className="w-full bg-muted">
                    {issue.aiAnalysis.codeSnippets
                      .slice(0, 3)
                      .map((_, index) => (
                        <TabsTrigger
                          key={index}
                          value={`snippet${index}`}
                          className="flex-1 text-xs data-[state=active]:bg-background"
                        >
                          스니펫 {index + 1}
                        </TabsTrigger>
                      ))}
                  </TabsList>

                  {issue.aiAnalysis.codeSnippets
                    .slice(0, 3)
                    .map((snippet, index) => {
                      const ext =
                        snippet.file?.split('.').pop()?.toLowerCase() || '';
                      const extToLang = {
                        js: 'javascript',
                        jsx: 'javascript',
                        ts: 'typescript',
                        tsx: 'typescript',
                        py: 'python',
                        java: 'java',
                        go: 'go',
                        rb: 'ruby',
                        php: 'php',
                        c: 'c',
                        cpp: 'cpp',
                        cs: 'csharp',
                        html: 'html',
                        css: 'css',
                        json: 'json',
                        md: 'markdown',
                        sh: 'bash',
                        yml: 'yaml',
                        yaml: 'yaml',
                        swift: 'swift',
                        kt: 'kotlin',
                        rs: 'rust',
                        dart: 'dart',
                        sql: 'sql',
                        // 필요시 추가
                      };
                      const lang = extToLang[ext] || '';

                      return (
                        <TabsContent
                          key={index}
                          value={`snippet${index}`}
                          className="mt-2"
                        >
                          <div className="relative border rounded-lg bg-card">
                            <div className="absolute top-2 right-2 z-10">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-background/80 hover:bg-background"
                                onClick={() =>
                                  navigator.clipboard.writeText(snippet.code)
                                }
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-t-lg text-sm font-mono overflow-x-auto max-h-128">
                              <MarkdownRenderer>
                                {` \`\`\`${lang}\n${snippet.code}\n\`\`\` `}
                              </MarkdownRenderer>
                            </div>
                            <div className="p-2 border-t bg-card rounded-b-lg">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground truncate mr-2">
                                  {snippet.file}
                                </span>
                                <span className="text-primary font-medium">
                                  {snippet.relevance}%
                                </span>
                              </div>
                              {snippet.explanation && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                  <strong className="text-foreground">
                                    설명:
                                  </strong>
                                  <span className="text-muted-foreground ml-1">
                                    {snippet.explanation}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                      );
                    })}
                </Tabs>
              ) : (
                <div className="text-xs text-muted-foreground p-2 text-center bg-muted/30 rounded-md">
                  AI 코드 스니펫이 없습니다.
                </div>
              )}
            </div>

            {/* AI 해결 제안 */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-foreground">
                AI 해결 제안
              </h3>
              <div className="p-3 bg-muted/30 border rounded-lg">
                <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none">
                  <MarkdownRenderer>
                    {issue.aiAnalysis.suggestion}
                  </MarkdownRenderer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 mx-auto">
        {/* 이슈 헤더 */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link to={`/repository/${repoId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <h1 className="text-xl font-bold tracking-tight truncate">
                <Link to={`/repository/${repoId}`} className="hover:underline">
                  {issue.repoName}
                </Link>
                <span className="mx-1">/</span>
                <span>이슈 #{issueId}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* 탭 UI로 이슈/AI 분석 분리 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-muted mb-2">
            <TabsTrigger
              value="issue"
              className="flex-1 text-sm data-[state=active]:bg-background"
            >
              이슈 내용
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="flex-1 text-sm data-[state=active]:bg-background"
            >
              AI 분석
            </TabsTrigger>
          </TabsList>

          {/* 이슈 내용 탭 */}
          <TabsContent value="issue" className="mt-0">
            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="p-4 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={issue.state === 'open' ? 'default' : 'secondary'}
                      className={`px-3 py-1 ${
                        issue.state === 'open' ? 'bg-green-600' : ''
                      }`}
                    >
                      {issue.state === 'open' ? '열림' : '닫힘'}
                    </Badge>
                    <h2 className="text-xl font-semibold max-w-md">
                      {issue.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      #{issueId}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      asChild
                    >
                      <a
                        href={`https://github.com/${issue.repoFullName}/issues/${issueId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub에서 보기
                        <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              {/* 이슈 본문 */}
              <div>
                <div>
                  {/* 이슈 작성자 정보 및 본문 */}
                  <div className="border-b">
                    <div className="p-4">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {issue.user.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{issue.user}</span>
                          <span className="text-sm text-muted-foreground">
                            작성일: {issue.createdAt}
                          </span>
                        </div>
                        {/* 마크다운 본문 렌더링 */}
                        <div className="mt-2 prose prose-sm max-w-none">
                          <MarkdownRenderer>
                            {issue.body || ''}
                          </MarkdownRenderer>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-4">
                          {issue.labels.map((label) => (
                            <Badge
                              key={label.name}
                              variant="outline"
                              className="bg-opacity-10"
                              style={{
                                backgroundColor: `${label.color}20`,
                                borderColor: label.color,
                              }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* 댓글 섹션 */}
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-4">
                      댓글 ({issue.comments.length})
                    </h3>
                    {issue.comments.length > 0 ? (
                      <div className="space-y-4">
                        {issue.comments.map((comment, index) => (
                          <div key={index} className="border rounded-lg">
                            <div className="bg-muted/30 p-2 px-4 border-b flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                  <span className="text-xs font-medium text-gray-600">
                                    {comment.user?.charAt(0).toUpperCase() ||
                                      'U'}
                                  </span>
                                </div>
                                <span className="text-sm font-medium">
                                  {comment.user || '사용자'}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {comment.createdAt || ''}
                              </span>
                            </div>
                            <div className="p-4">
                              <p className="text-sm">{comment.body || ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        댓글이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            {renderAiAnalysisContent()}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
